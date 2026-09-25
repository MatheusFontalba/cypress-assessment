// Limpa o que o teste criou: primeiro o carrinho, depois os produtos e os usuários.
// Quem chama a função passa os registros nessa ordem.
export function limparRecursos(recursos) {
  const erros = [];
  return cy.wrap(recursos, { log: false }).each(({
    mensagens = ['Registro excluído com sucesso'], ...recurso
  }) => {
    return cy.request({ ...recurso, method: 'DELETE', failOnStatusCode: false }).then((response) => {
      if (response.status !== 200 || !mensagens.includes(response.body.message)) {
        // Guarda o erro e segue com as outras exclusões.
        erros.push(`${recurso.url}: ${response.status} ${response.body.message}`);
      }
    });
  }).then(() => {
    expect(erros, 'falhas na limpeza dos recursos do teste').to.deep.equal([]);
  });
}
