import { limparRecursos } from '../helpers/limpeza';
import { criarDadosUsuario } from '../helpers/usuarios';
import { criarDadosProduto } from '../helpers/produtos';
import { loginPage } from '../pages/login';
import { produtosAdminPage } from '../pages/produtos-admin';

describe('Frontend | Cadastro administrativo de produtos', () => {
  let api;
  let admin;
  let adminId;
  let token;
  let produtosIds;

  beforeEach(() => {
    api = Cypress.expose('apiUrl');
    admin = criarDadosUsuario({ administrador: 'true' });
    adminId = token = undefined;
    produtosIds = new Set();
    cy.request('POST', `${api}/usuarios`, admin).then((response) => {
      adminId = response.body._id;
      expect(response.status, 'preparação do administrador').to.equal(201);
      expect(adminId).to.be.a('string').and.not.be.empty;
    });
    // Guarda o token do login feito pela tela para excluir os produtos ao final.
    cy.intercept('POST', `${api}/login`, (req) => {
      req.on('response', (res) => { token = res.body.authorization; });
    }).as('login');
    cy.intercept('POST', `${api}/produtos`, (req) => {
      req.on('response', (res) => {
        if (res.body._id) produtosIds.add(res.body._id);
      });
    }).as('cadastroProduto');
    loginPage.abrir();
    loginPage.entrar(admin);
    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/admin/home');
    produtosAdminPage.abrirPeloMenu();
    cy.location('pathname').should('eq', '/admin/cadastrarprodutos');
  });

  afterEach(() => {
    const recursos = [
      ...[...produtosIds].map((id) => ({ url: `${api}/produtos/${id}`, headers: { Authorization: token } })),
      ...(adminId ? [{ url: `${api}/usuarios/${adminId}` }] : []),
    ];
    return limparRecursos(recursos);
  });

  it('Fazer login, cadastrar produto sem imagem e conferir a listagem', () => {
    const produto = criarDadosProduto();
    produtosAdminPage.preencher(produto);
    produtosAdminPage.cadastrar();
    cy.wait('@cadastroProduto').then(({ response }) => {
      expect(response.statusCode).to.equal(201);
      expect(response.body.message).to.equal('Cadastro realizado com sucesso');
      expect(response.body._id).to.be.a('string').and.not.be.empty;
      cy.request('GET', `${api}/produtos/${response.body._id}`).then((consulta) => {
        expect(consulta.status).to.equal(200);
        expect(consulta.body).to.include(produto);
      });
    });
    cy.location('pathname').should('eq', '/admin/listarprodutos');
    cy.contains('h1', 'Lista dos Produtos').should('be.visible');
    produtosAdminPage.linhaDoProduto(produto.nome).should('be.visible').within(() => {
      cy.get('td').eq(0).should('have.text', produto.nome);
      cy.get('td').eq(1).should('have.text', String(produto.preco));
      cy.get('td').eq(2).should('have.text', produto.descricao);
      cy.get('td').eq(3).should('have.text', String(produto.quantidade));
    });
  });

  it('Exibir erro para nome de produto duplicado', () => {
    const original = criarDadosProduto();
    let originalId;
    // Lê o token só quando chegar a esta etapa, depois de concluir o login.
    cy.then(() => cy.request({
      method: 'POST', url: `${api}/produtos`, body: original,
      headers: { Authorization: token },
    })).then((response) => {
      originalId = response.body._id;
      if (originalId) produtosIds.add(originalId);
      expect(response.status, 'preparação do produto original').to.equal(201);
    });
    produtosAdminPage.preencher(criarDadosProduto({ nome: original.nome, preco: original.preco + 1 }));
    produtosAdminPage.cadastrar();
    cy.wait('@cadastroProduto').its('response.statusCode').should('eq', 400);
    produtosAdminPage.mensagemDeErro().should('be.visible').and('contain.text', 'Já existe produto com esse nome');
    cy.location('pathname').should('eq', '/admin/cadastrarprodutos');
    cy.request({ url: `${api}/produtos`, qs: { nome: original.nome } }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ quantidade: 1, produtos: [{ _id: originalId, ...original }] });
    });
  });

  it('Exibir erro quando o nome do produto não for preenchido', () => {
    produtosAdminPage.preencher(criarDadosProduto({ nome: undefined }));
    produtosAdminPage.cadastrar();
    cy.wait('@cadastroProduto').then(({ response }) => {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.deep.equal({ nome: 'nome é obrigatório' });
    });
    produtosAdminPage.mensagemDeErro().should('be.visible').and('contain.text', 'Nome é obrigatório');
    cy.location('pathname').should('eq', '/admin/cadastrarprodutos');
  });
});
