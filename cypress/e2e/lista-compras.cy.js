import { criarMassaCompras, prepararAdministradorCompras, limparMassaCompras } from '../helpers/massa-compras';
import { loginPage } from '../pages/login';
import { listaComprasPage } from '../pages/lista-compras';
import { usuariosAdminPage } from '../pages/usuarios-admin';
import { produtosAdminPage } from '../pages/produtos-admin';

describe('Frontend | Lista de compras', () => {
  let massa;

  beforeEach(() => {
    massa = criarMassaCompras();
    prepararAdministradorCompras(massa);
  });

  afterEach(() => {
    limparMassaCompras(massa);
  });

  it('deve cadastrar comprador e produto como administrador e gerenciar a lista como comprador', () => {
    const api = Cypress.expose('apiUrl');
    cy.intercept('POST', `${api}/login`, (req) => {
      req.on('response', (res) => {
        // O login do comprador não pode sobrescrever o token usado na limpeza dos produtos.
        if (req.body.email === massa.admin.email) massa.tokenAdmin = res.body.authorization;
      });
    }).as('login');
    cy.intercept('POST', `${api}/usuarios`, (req) => {
      req.on('response', (res) => {
        if (res.body._id) massa.usuariosIds.push(res.body._id);
      });
    }).as('comprador');
    cy.intercept('POST', `${api}/produtos`, (req) => {
      req.on('response', (res) => { massa.produtoId = res.body._id; });
    }).as('produto');

    loginPage.abrir();
    loginPage.entrar(massa.admin);
    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/admin/home');
    usuariosAdminPage.abrirPeloMenu();
    usuariosAdminPage.preencher(massa.comprador);
    usuariosAdminPage.cadastrar();
    cy.wait('@comprador').then(({ request, response }) => {
      expect(request.body).to.deep.equal(massa.comprador);
      expect(response.statusCode).to.equal(201);
    });
    cy.location('pathname').should('eq', '/admin/listarusuarios');
    usuariosAdminPage.linhaDoUsuario(massa.comprador.email).should('be.visible').within(() => {
      cy.get('td').eq(0).should('have.text', massa.comprador.nome);
      cy.get('td').eq(3).should('have.text', 'false');
    });

    produtosAdminPage.abrirPeloMenu();
    produtosAdminPage.preencher(massa.produto);
    produtosAdminPage.cadastrar();
    cy.wait('@produto').its('response.statusCode').should('eq', 201);
    cy.location('pathname').should('eq', '/admin/listarprodutos');
    produtosAdminPage.linhaDoProduto(massa.produto.nome).should('be.visible').within(() => {
      cy.get('td').eq(1).should('have.text', '125');
      cy.get('td').eq(2).should('have.text', massa.produto.descricao);
      cy.get('td').eq(3).should('have.text', '10');
    });

    // A partir daqui, usamos o comprador que o administrador acabou de cadastrar.
    loginPage.sair();
    cy.location('pathname').should('eq', '/login');
    loginPage.entrar(massa.comprador);
    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/home');

    cy.intercept({ method: 'GET', pathname: '/produtos', query: { nome: massa.produto.nome } }).as('pesquisa');
    listaComprasPage.pesquisar(massa.produto.nome);
    cy.wait('@pesquisa').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
      expect(response.body.produtos).to.have.length(1);
      expect(response.body.produtos[0]._id).to.equal(massa.produtoId);
    });
    listaComprasPage.produtoNaVitrine(massa.produto.nome).should('be.visible');
    listaComprasPage.adicionar(massa.produto.nome);

    cy.location('pathname').should('eq', '/minhaListaDeProdutos');
    listaComprasPage.nomesNaLista().should('have.length', 1)
      .and('have.text', `Produto:${massa.produto.nome}`);
    listaComprasPage.produtoNaLista(massa.produto.nome).within(() => {
      cy.get('[data-testid="shopping-cart-product-quantity"]').should('have.text', 'Total: 1');
      cy.contains('p', /^Preço R\$125$/).should('be.visible');
    });

    listaComprasPage.aumentarQuantidade(massa.produto.nome);
    listaComprasPage.produtoNaLista(massa.produto.nome).within(() => {
      cy.get('[data-testid="shopping-cart-product-quantity"]').should('have.text', 'Total: 2');
      cy.contains('p', /^Preço R\$250$/).should('be.visible');
    });
    listaComprasPage.diminuirQuantidade(massa.produto.nome);
    listaComprasPage.produtoNaLista(massa.produto.nome).within(() => {
      cy.get('[data-testid="shopping-cart-product-quantity"]').should('have.text', 'Total: 1');
      cy.contains('p', /^Preço R\$125$/).should('be.visible');
    });
    // Como há um só produto, Limpar Lista remove o item e deixa a lista vazia.
    listaComprasPage.limpar();
    listaComprasPage.mensagemListaVazia().should('be.visible').and('have.text', 'Seu carrinho está vazio');
    listaComprasPage.nomesNaLista().should('not.exist');
    // Confere se a lista continua vazia depois de recarregar, não só na tela atual.
    cy.reload();
    listaComprasPage.mensagemListaVazia().should('be.visible');
    listaComprasPage.nomesNaLista().should('not.exist');
  });
});
