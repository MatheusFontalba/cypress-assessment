import { limparRecursos } from '../helpers/limpeza';
import { criarDadosUsuario } from '../helpers/usuarios';

describe('API | Gestão de usuários', () => {
  let idsCriados;

  beforeEach(() => {
    idsCriados = new Set();
  });

  function cadastrar(body) {
    return cy.request({ method: 'POST', url: '/usuarios', body, failOnStatusCode: false })
      .then((response) => {
        // Se a API cadastrar por engano num teste negativo, também precisamos limpar esse usuário.
        if (typeof response.body._id === 'string') idsCriados.add(response.body._id);
        return response;
      });
  }

  afterEach(() => {
    return limparRecursos([...idsCriados].map((id) => ({ url: `/usuarios/${id}` })));
  });

  describe('Cadastro | POST /usuarios', () => {
    ['true', 'false'].forEach((administrador) => {
      it(`deve cadastrar usuário com administrador = "${administrador}"`, () => {
        const usuario = criarDadosUsuario({ administrador });
        let usuarioId;
        cadastrar(usuario).then((response) => {
          usuarioId = response.body._id;
          expect(response.status).to.equal(201);
          expect(response.headers['content-type']).to.include('application/json');
          expect(response.body.message).to.equal('Cadastro realizado com sucesso');
          expect(usuarioId).to.match(/^[a-zA-Z0-9]{16}$/);

          return cy.request('GET', `/usuarios/${usuarioId}`);
        }).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.include({ _id: usuarioId, ...usuario });
        });
      });
    });

    it('deve recusar e-mail duplicado sem alterar o usuário original', () => {
      const original = criarDadosUsuario();
      let usuarioId;
      cadastrar(original).then((response) => {
        expect(response.status).to.equal(201);
        usuarioId = response.body._id;
        return cadastrar(criarDadosUsuario({ email: original.email, administrador: 'false' }));
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({ message: 'Este email já está sendo usado' });
        return cy.request({ url: '/usuarios', qs: { email: original.email } });
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.quantidade).to.equal(1);
        expect(response.body.usuarios).to.deep.equal([{ _id: usuarioId, ...original }]);
      });
    });

    // Muda um campo por vez para ficar claro qual regra falhou.
    const invalidos = [
      ...['nome', 'email', 'password', 'administrador'].map((campo) => ({
        campo, tipo: 'ausente', valor: undefined,
      })),
      { campo: 'email', tipo: 'malformado', valor: 'sem-arroba' },
      { campo: 'administrador', tipo: 'booleano em vez de string', valor: true },
      { campo: 'password', tipo: 'vazio', valor: '' },
    ];

    invalidos.forEach(({ campo, tipo, valor }) => {
      it(`deve recusar ${campo} ${tipo}`, () => {
        const usuario = criarDadosUsuario({ [campo]: valor });
        if (valor === undefined) delete usuario[campo];
        cadastrar(usuario).then((response) => {
          expect(response.status).to.equal(400);
          expect(response.body).not.to.have.property('_id');
          expect(response.body).to.have.all.keys(campo);
          expect(response.body[campo]).to.be.a('string').and.not.be.empty;
        });
      });
    });
  });

  describe('Edição | PUT /usuarios/{id}', () => {
    it('deve editar os dados e o perfil de um usuário existente', () => {
      const atualizado = criarDadosUsuario({ administrador: 'false' });
      let usuarioId;

      cadastrar(criarDadosUsuario()).then((response) => {
        expect(response.status).to.equal(201);
        usuarioId = response.body._id;
        return cy.request('PUT', `/usuarios/${usuarioId}`, atualizado);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ message: 'Registro alterado com sucesso' });
        return cy.request('GET', `/usuarios/${usuarioId}`);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ _id: usuarioId, ...atualizado });
      });
    });

    it('deve recusar edição com e-mail de outro usuário sem alterar os registros', () => {
      const original = criarDadosUsuario();
      const outro = criarDadosUsuario();
      let usuarioId;
      let outroId;

      cadastrar(original).then((response) => {
        expect(response.status).to.equal(201);
        usuarioId = response.body._id;
        return cadastrar(outro);
      }).then((response) => {
        expect(response.status).to.equal(201);
        outroId = response.body._id;
        return cy.request({
          method: 'PUT', url: `/usuarios/${usuarioId}`,
          body: { ...original, email: outro.email }, failOnStatusCode: false,
        });
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({ message: 'Este email já está sendo usado' });
        return cy.request('GET', `/usuarios/${usuarioId}`);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ _id: usuarioId, ...original });
        return cy.request('GET', `/usuarios/${outroId}`);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ _id: outroId, ...outro });
      });
    });
  });

  describe('Exclusão | DELETE /usuarios/{id}', () => {
    it('deve excluir um usuário sem carrinho e torná-lo indisponível para consulta', () => {
      let usuarioId;

      cadastrar(criarDadosUsuario()).then((response) => {
        expect(response.status).to.equal(201);
        usuarioId = response.body._id;
        return cy.request('DELETE', `/usuarios/${usuarioId}`);
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({ message: 'Registro excluído com sucesso' });
        return cy.request({ url: `/usuarios/${usuarioId}`, failOnStatusCode: false });
      }).then((response) => {
        // O teste já excluiu este usuário; a limpeza não precisa tentar de novo.
        if (response.status === 400 && response.body.message === 'Usuário não encontrado') {
          idsCriados.delete(usuarioId);
        }
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({ message: 'Usuário não encontrado' });
      });
    });
  });
});
