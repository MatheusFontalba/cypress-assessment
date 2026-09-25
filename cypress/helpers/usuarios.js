const { faker } = require('@faker-js/faker/locale/pt_BR');

// Gera os dados, mas não cadastra o usuário. Use overrides para mudar o perfil ou testar um campo inválido.
function criarDadosUsuario(overrides = {}) {
  return {
    nome: faker.person.fullName(),
    // Evita depender de um e-mail fixo, que outra execução pode ter usado.
    email: faker.internet.email({
      firstName: 'qa',
      lastName: faker.string.uuid(),
      provider: 'example.com',
    }),
    password: faker.internet.password({ length: 16 }),
    administrador: 'true',
    ...overrides,
  };
}

module.exports = { criarDadosUsuario };
