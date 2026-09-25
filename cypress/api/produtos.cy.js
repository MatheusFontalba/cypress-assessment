import { limparRecursos } from '../helpers/limpeza';
import { criarDadosUsuario } from '../helpers/usuarios';
import { criarDadosProduto } from '../helpers/produtos';

describe('API | Gestão de produtos', () => {
  let adminId;
  let token;
  let produtoId;
  let produtosIds;
  let usuarioComumId;

  function cadastrarProduto(body, authorization) {
    return cy.request({
      method: 'POST', url: '/produtos', body, failOnStatusCode: false,
      headers: authorization ? { Authorization: authorization } : {},
    }).then((response) => {
      if (typeof response.body._id === 'string') produtosIds.add(response.body._id);
      return response;
    });
  }

  beforeEach(() => {
    // O administrador também serve para limpar uma criação indevida nos casos negativos.
    adminId = undefined;
    token = undefined;
    produtoId = undefined;
    produtosIds = new Set();
    usuarioComumId = undefined;
    const admin = criarDadosUsuario({ administrador: 'true' });

    cy.request('POST', '/usuarios', admin).then((response) => {
      adminId = response.body._id;
      expect(response.status, 'preparação do administrador').to.equal(201);
      expect(adminId).to.be.a('string').and.not.be.empty;
      return cy.request({
        method: 'POST', url: '/login', log: false,
        body: { email: admin.email, password: admin.password },
      });
    }).then((response) => {
      expect(response.status, 'autenticação do administrador').to.equal(200);
      token = response.body.authorization;
      expect(token).to.be.a('string').and.match(/^Bearer .+/);
    });
  });

  afterEach(() => {
    const recursos = [
      ...[...produtosIds].map((id) => ({ url: `/produtos/${id}`, headers: { Authorization: token } })),
      ...(usuarioComumId ? [{ url: `/usuarios/${usuarioComumId}` }] : []),
      ...(adminId ? [{ url: `/usuarios/${adminId}` }] : []),
    ];
    return limparRecursos(recursos);
  });

  describe('Cadastro | POST /produtos', () => {
    it('Administrador cadastrar produto e consultar os dados', () => {
      const produto = criarDadosProduto();

      cadastrarProduto(produto, token).then((response) => {
        // Guarda o ID antes das validações, caso alguma delas falhe.
        produtoId = response.body._id;
        expect(response.status).to.equal(201);
        expect(response.headers['content-type']).to.include('application/json');
        expect(produtoId).to.be.a('string').and.not.be.empty;
        expect(response.body).to.deep.equal({
          message: 'Cadastro realizado com sucesso', _id: produtoId,
        });
        return cy.request('GET', `/produtos/${produtoId}`);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ _id: produtoId, ...produto });
      });
    });

    it('Recusar cadastro sem token', () => {
      const produto = criarDadosProduto();
      cadastrarProduto(produto).then((response) => {
        expect(response.status).to.equal(401);
        expect(response.body).to.deep.equal({
          message: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        });
        return cy.request({ url: '/produtos', qs: { nome: produto.nome } });
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ quantidade: 0, produtos: [] });
      });
    });

    it('Recusar cadastro por usuário comum autenticado', () => {
      const usuario = criarDadosUsuario({ administrador: 'false' });
      const produto = criarDadosProduto();
      cy.request('POST', '/usuarios', usuario).then((response) => {
        usuarioComumId = response.body._id;
        expect(response.status, 'preparação do usuário comum').to.equal(201);
        expect(usuarioComumId).to.be.a('string').and.not.be.empty;
        return cy.request({
          method: 'POST', url: '/login', log: false,
          body: { email: usuario.email, password: usuario.password },
        });
      }).then((response) => {
        expect(response.status, 'autenticação do usuário comum').to.equal(200);
        expect(response.body.authorization).to.be.a('string').and.match(/^Bearer .+/);
        return cadastrarProduto(produto, response.body.authorization);
      }).then((response) => {
        expect(response.status).to.equal(403);
        expect(response.body).to.deep.equal({ message: 'Rota exclusiva para administradores' });
        return cy.request({ url: '/produtos', qs: { nome: produto.nome } });
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ quantidade: 0, produtos: [] });
      });
    });

    it('Recusar nome de produto duplicado', () => {
      const original = criarDadosProduto();
      const duplicado = criarDadosProduto({ nome: original.nome, preco: original.preco + 1 });
      cadastrarProduto(original, token).then((response) => {
        expect(response.status, 'preparação do produto original').to.equal(201);
        produtoId = response.body._id;
        expect(produtoId).to.be.a('string').and.not.be.empty;
        return cadastrarProduto(duplicado, token);
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({ message: 'Já existe produto com esse nome' });
        return cy.request({ url: '/produtos', qs: { nome: original.nome } });
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({
          quantidade: 1, produtos: [{ _id: produtoId, ...original }],
        });
      });
    });
  });
});
