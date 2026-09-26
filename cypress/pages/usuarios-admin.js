export const usuariosAdminPage = {
  abrirPeloMenu() {
    cy.get('[data-testid="cadastrar-usuarios"]').click();
  },
  preencher({ nome, email, password, administrador }) {
    // Sem nome nos dados, deixa o campo vazio para testar o preenchimento obrigatório.
    if (nome) cy.get('[data-testid="nome"]').type(nome, { parseSpecialCharSequences: false });
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password, { log: false, parseSpecialCharSequences: false });
    if (administrador === 'true') {
      cy.get('[data-testid="checkbox"]').check();
    } else {
      cy.get('[data-testid="checkbox"]').uncheck();
    }
  },
  cadastrar() {
    cy.get('[data-testid="cadastrarUsuario"]').click();
  },
  mensagemDeErro() {
    return cy.get('[role="alert"]');
  },
  linhaDoUsuario(email) {
    // Busca pelo e-mail do teste; a posição da linha muda conforme outros usuários são cadastrados.
    return cy.contains('tbody td', email).closest('tr');
  },
};
