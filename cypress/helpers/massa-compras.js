import { limparRecursos } from './limpeza';
import { criarDadosProduto } from './produtos';
import { criarDadosUsuario } from './usuarios';

export function criarMassaCompras() {
  return {
    admin: criarDadosUsuario(),
    comprador: criarDadosUsuario({ administrador: 'false' }),
    // Preço fixo para conferir o total quando a quantidade mudar na tela.
    produto: criarDadosProduto({
      preco: 125,
      descricao: 'Produto fictício para automação da lista de compras',
      quantidade: 10,
    }),
    usuariosIds: [],
  };
}

// Só o administrador nasce pela API. Comprador e produto serão cadastrados pelas telas.
export function prepararAdministradorCompras(massa) {
  const api = Cypress.expose('apiUrl');
  return cy.request('POST', `${api}/usuarios`, massa.admin).then((response) => {
    if (response.body._id) massa.usuariosIds.push(response.body._id);
    expect(response.status, 'criação do administrador').to.equal(201);
    expect(response.body._id).to.be.a('string').and.not.be.empty;
  });
}

export function limparMassaCompras(massa) {
  const api = Cypress.expose('apiUrl');
  // O produto precisa sair antes do administrador, pois a exclusão usa o token dele.
  const recursos = [
    ...(massa.produtoId ? [{ url: `${api}/produtos/${massa.produtoId}`, headers: { Authorization: massa.tokenAdmin } }] : []),
    ...massa.usuariosIds.map((id) => ({ url: `${api}/usuarios/${id}` })),
  ];
  return limparRecursos(recursos);
}
