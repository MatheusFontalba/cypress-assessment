export const loginPage = {
  sair() {
    cy.get('[data-testid="logout"]').click();
  },
  abrir() {
    cy.visit('/login');
  },
  entrar({ email, password }) {
    cy.get('[data-testid="email"]').type(email);
    // Digita a senha literalmente, mesmo se o Faker gerar chaves ou outros caracteres especiais.
    cy.get('[data-testid="senha"]').type(password, { log: false, parseSpecialCharSequences: false });
    cy.get('[data-testid="entrar"]').click();
  },
};
