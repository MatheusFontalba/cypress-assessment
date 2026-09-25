export const listaComprasPage = {
  pesquisar(nome) {
    cy.get('[data-testid="pesquisar"]').clear().type(nome);
    cy.get('[data-testid="botaoPesquisar"]').click();
  },
  produtoNaVitrine(nome) {
    return cy.contains('.card-title', nome).closest('.card');
  },
  adicionar(nome) {
    this.produtoNaVitrine(nome).find('[data-testid="adicionarNaLista"]').click();
  },
  nomesNaLista() {
    return cy.get('[data-testid="shopping-cart-product-name"]');
  },
  produtoNaLista(nome) {
    // Limita as ações ao cartão certo quando houver mais de um produto.
    return cy.contains('[data-testid="shopping-cart-product-name"]', nome).closest('.card');
  },
  aumentarQuantidade(nome) {
    this.produtoNaLista(nome).find('[data-testid="product-increase-quantity"]').click();
  },
  diminuirQuantidade(nome) {
    // Diminui a quantidade. Para esvaziar a lista, o teste usa limpar().
    this.produtoNaLista(nome).find('[data-testid="product-decrease-quantity"]').click();
  },
  mensagemListaVazia() {
    return cy.get('[data-testid="shopping-cart-empty-message"]');
  },
  limpar() {
    cy.get('[data-testid="limparLista"]').click();
  },
};
