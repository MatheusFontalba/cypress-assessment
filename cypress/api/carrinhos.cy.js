import { limparRecursos } from '../helpers/limpeza';
import { criarDadosUsuario } from '../helpers/usuarios';
import { criarDadosProduto } from '../helpers/produtos';

describe('API | Carrinhos e estoque', () => {
  let usuariosIds;
  let adminToken;
  let compradorToken;
  let compradorId;
  let produtoId;
  let produto;

  function prepararUsuario(administrador) {
    const usuario = criarDadosUsuario({ administrador });
    let id;
    return cy.request('POST', '/usuarios', usuario).then((response) => {
      id = response.body._id;
      if (id) usuariosIds.push(id);
      expect(response.status, 'preparação do usuário').to.equal(201);
      expect(id).to.be.a('string').and.not.be.empty;
      return cy.request({
        method: 'POST', url: '/login', log: false,
        body: { email: usuario.email, password: usuario.password },
      });
    }).then((response) => {
      expect(response.status, 'autenticação de preparação').to.equal(200);
      expect(response.body.authorization).to.be.a('string').and.match(/^Bearer .+/);
      return { id, token: response.body.authorization };
    });
  }

  function criarCarrinho(quantidade) {
    return cy.request({
      method: 'POST', url: '/carrinhos', failOnStatusCode: false,
      headers: { Authorization: compradorToken },
      body: { produtos: [{ idProduto: produtoId, quantidade }] },
    });
  }

  beforeEach(() => {
    usuariosIds = [];
    adminToken = compradorToken = compradorId = produtoId = undefined;
    // Com cinco unidades, podemos conferir a reserva de duas e a rejeição de seis.
    produto = criarDadosProduto({ preco: 100, quantidade: 5 });
    prepararUsuario('true').then(({ token }) => {
      adminToken = token;
      return prepararUsuario('false');
    }).then(({ id, token }) => {
      compradorId = id;
      compradorToken = token;
      return cy.request({
        method: 'POST', url: '/produtos', body: produto,
        headers: { Authorization: adminToken },
      });
    }).then((response) => {
      produtoId = response.body._id;
      expect(response.status, 'preparação do produto').to.equal(201);
      expect(produtoId).to.be.a('string').and.not.be.empty;
    });
  });

  afterEach(() => {
    const recursos = [
      // Cancela pelo comprador, mesmo se o carrinho tiver sido criado por engano num teste negativo.
      ...(compradorToken ? [{ url: '/carrinhos/cancelar-compra', headers: { Authorization: compradorToken },
        mensagens: ['Registro excluído com sucesso. Estoque dos produtos reabastecido', 'Não foi encontrado carrinho para esse usuário'] }] : []),
      ...(produtoId ? [{ url: `/produtos/${produtoId}`, headers: { Authorization: adminToken } }] : []),
      ...usuariosIds.map((id) => ({ url: `/usuarios/${id}` })),
    ];
    return limparRecursos(recursos);
  });

  it('deve criar e cancelar o carrinho restaurando o estoque', () => {
    let carrinhoId;
    criarCarrinho(2).then((response) => {
      carrinhoId = response.body._id;
      expect(response.status).to.equal(201);
      expect(carrinhoId).to.be.a('string').and.not.be.empty;
      expect(response.body.message).to.equal('Cadastro realizado com sucesso');
      return cy.request('GET', `/carrinhos/${carrinhoId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        _id: carrinhoId, idUsuario: compradorId, precoTotal: 200, quantidadeTotal: 2,
        produtos: [{ idProduto: produtoId, quantidade: 2, precoUnitario: 100 }],
      });
      return cy.request('GET', `/produtos/${produtoId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.quantidade).to.equal(3);
      return cy.request({ method: 'DELETE', url: '/carrinhos/cancelar-compra',
        headers: { Authorization: compradorToken } });
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Registro excluído com sucesso. Estoque dos produtos reabastecido' });
      return cy.request({ url: `/carrinhos/${carrinhoId}`, failOnStatusCode: false });
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ message: 'Carrinho não encontrado' });
      return cy.request('GET', `/produtos/${produtoId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ _id: produtoId, ...produto });
    });
  });

  it('deve recusar quantidade acima do estoque sem criar carrinho ou reduzir estoque', () => {
    criarCarrinho(6).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Produto não possui quantidade suficiente');
      expect(response.body).not.to.have.property('_id');
      return cy.request({ url: '/carrinhos', qs: { idUsuario: compradorId } });
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ quantidade: 0, carrinhos: [] });
      return cy.request('GET', `/produtos/${produtoId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ _id: produtoId, ...produto });
    });
  });

  it('deve impedir a exclusão de usuário com carrinho cadastrado', () => {
    let carrinhoId;
    criarCarrinho(1).then((response) => {
      expect(response.status, 'preparação do carrinho').to.equal(201);
      carrinhoId = response.body._id;
      expect(carrinhoId).to.be.a('string').and.not.be.empty;
      return cy.request({ method: 'DELETE', url: `/usuarios/${compradorId}`, failOnStatusCode: false });
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({
        message: 'Não é permitido excluir usuário com carrinho cadastrado', idCarrinho: carrinhoId,
      });
      return cy.request('GET', `/usuarios/${compradorId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body._id).to.equal(compradorId);
      return cy.request('GET', `/carrinhos/${carrinhoId}`);
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.idUsuario).to.equal(compradorId);
      expect(response.body._id).to.equal(carrinhoId);
    });
  });
});
