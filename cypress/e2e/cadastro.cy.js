import { limparRecursos } from '../helpers/limpeza';
import { criarDadosUsuario } from '../helpers/usuarios';
import { usuariosAdminPage } from '../pages/usuarios-admin';

describe('Frontend | Cadastro administrativo de usuários', () => {
  let idsCriados;
  let api;

  beforeEach(() => {
    idsCriados = new Set();
    api = Cypress.expose('apiUrl');
    // Guarda os IDs da resposta real para limpar os usuários, mesmo se o teste falhar depois.
    cy.intercept('POST', `${api}/usuarios`, (req) => {
      req.on('response', (res) => {
        if (res.body._id) idsCriados.add(res.body._id);
      });
    }).as('cadastro');
    const admin = criarDadosUsuario({ administrador: 'true' });

    cy.request('POST', `${api}/usuarios`, admin).then((response) => {
      if (response.body._id) idsCriados.add(response.body._id);
      expect(response.status, 'preparação do administrador').to.equal(201);
      expect(response.body._id).to.be.a('string').and.not.be.empty;
      return cy.request({
        method: 'POST', url: `${api}/login`, log: false,
        body: { email: admin.email, password: admin.password },
      });
    }).then((response) => {
      expect(response.status, 'autenticação de preparação').to.equal(200);
      const token = response.body.authorization;
      expect(token).to.be.a('string').and.match(/^Bearer .+/);
      cy.visit('/admin/cadastrarusuarios', {
        onBeforeLoad(win) {
          // O foco aqui é o cadastro; o administrador já entra autenticado no formulário.
          win.localStorage.setItem('serverest/userToken', token);
          win.localStorage.setItem('serverest/userEmail', admin.email);
          win.localStorage.setItem('serverest/userNome', admin.nome);
        },
      });
    });
  });

  afterEach(() => {
    return limparRecursos([...idsCriados].map((id) => ({ url: `${api}/usuarios/${id}` })));
  });

  it('deve cadastrar um usuário comum e exibi-lo na listagem', () => {
    const usuario = criarDadosUsuario({ administrador: 'false' });

    cy.location('pathname').should('eq', '/admin/cadastrarusuarios');
    cy.contains('h1', 'Cadastro de usuários').should('be.visible');
    usuariosAdminPage.preencher(usuario);
    usuariosAdminPage.cadastrar();

    cy.wait('@cadastro').then(({ request, response }) => {
      expect(request.body).to.deep.equal(usuario);
      expect(response.statusCode).to.equal(201);
      expect(response.body.message).to.equal('Cadastro realizado com sucesso');
      expect(response.body._id).to.be.a('string').and.not.be.empty;
    });
    cy.location('pathname').should('eq', '/admin/listarusuarios');
    cy.contains('h1', 'Lista dos usuários').should('be.visible');
    usuariosAdminPage.linhaDoUsuario(usuario.email).should('be.visible').within(() => {
      cy.get('td').eq(0).should('have.text', usuario.nome);
      cy.get('td').eq(1).should('have.text', usuario.email);
      cy.get('td').eq(3).should('have.text', 'false');
    });
  });

  it('deve exibir erro ao cadastrar e-mail já utilizado', () => {
    const original = criarDadosUsuario({ administrador: 'false' });
    let originalId;
    cy.request('POST', `${api}/usuarios`, original).then((response) => {
      originalId = response.body._id;
      if (originalId) idsCriados.add(originalId);
      expect(response.status, 'preparação do usuário original').to.equal(201);
      expect(originalId).to.be.a('string').and.not.be.empty;
    });

    usuariosAdminPage.preencher(criarDadosUsuario({ email: original.email, administrador: 'false' }));
    usuariosAdminPage.cadastrar();
    cy.wait('@cadastro').then(({ response }) => {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.deep.equal({ message: 'Este email já está sendo usado' });
    });
    usuariosAdminPage.mensagemDeErro().should('be.visible')
      .and('contain.text', 'Este email já está sendo usado');
    cy.location('pathname').should('eq', '/admin/cadastrarusuarios');
    cy.request({ url: `${api}/usuarios`, qs: { email: original.email } }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        quantidade: 1, usuarios: [{ _id: originalId, ...original }],
      });
    });
  });

  it('deve exibir erro ao enviar o formulário sem preencher o nome', () => {
    const usuario = criarDadosUsuario({ nome: undefined, administrador: 'false' });
    usuariosAdminPage.preencher(usuario);
    usuariosAdminPage.cadastrar();
    cy.wait('@cadastro').then(({ request, response }) => {
      expect(request.body).not.to.have.property('nome');
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.deep.equal({ nome: 'nome é obrigatório' });
    });
    usuariosAdminPage.mensagemDeErro().should('be.visible')
      .and('contain.text', 'Nome é obrigatório');
    cy.location('pathname').should('eq', '/admin/cadastrarusuarios');
  });
});
