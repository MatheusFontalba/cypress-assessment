export const produtosAdminPage = {
  abrirPeloMenu() {
    cy.get('[data-testid="cadastrar-produtos"]').click();
  },
  preencher({ nome, preco, descricao, quantidade }) {
    // Deixar o nome de fora permite testar o formulário incompleto.
    if (nome) cy.get('[data-testid="nome"]').type(nome, { parseSpecialCharSequences: false });
    cy.get('[data-testid="preco"]').type(String(preco));
    cy.get('[data-testid="descricao"]').type(descricao, { parseSpecialCharSequences: false });
    cy.get('[data-testid="quantity"]').type(String(quantidade));
  },
  cadastrar() {
    // "cadastarProdutos" é o testid da aplicação, com essa grafia mesmo.
    cy.get('[data-testid="cadastarProdutos"]').click();
  },
  linhaDoProduto(nome) {
    // O nome gerado é exclusivo; não dependemos da ordem da listagem.
    return cy.contains('tbody td', nome).closest('tr');
  },
  mensagemDeErro() {
    return cy.get('[role="alert"]');
  },
};
