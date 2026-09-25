import { faker } from '@faker-js/faker/locale/pt_BR';

// Os valores padrão são válidos. O teste pode trocar preço, estoque ou qualquer outro campo.
export function criarDadosProduto(overrides = {}) {
  return {
    // O nome também precisa variar, pois a API não aceita produtos com nomes repetidos.
    nome: `${faker.commerce.productName()} ${faker.string.uuid()}`,
    preco: faker.number.int({ min: 1, max: 1000 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 1, max: 20 }),
    ...overrides,
  };
}
