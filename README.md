# ServeRest — automação com Cypress

Este projeto testa o ServeRest com JavaScript e Cypress. A cobertura inclui gestão
de usuários, cadastro de produtos, regras de carrinho e a jornada do administrador
até a lista de compras do comprador.

São **20 testes de API e 7 E2E**, organizados em três funcionalidades por camada.
Cada teste prepara os dados de que precisa e pode ser executado sozinho.
A jornada entre administrador e comprador fica em um único teste, porque suas
etapas fazem parte do mesmo fluxo.

Para esta entrega, as três funcionalidades foram tratadas como grupos de testes,
com casos positivos e negativos quando aplicável. Portanto, há mais de três casos
por camada. A lista de compras cobre apenas o caminho feliz completo.

## Requisitos e instalação

- Node.js 24 LTS e npm 10 ou superior.
- Google Chrome instalado (navegador padrão dos scripts).
- Acesso ao frontend e à API públicos do ServeRest.

Na pasta que contém `package.json`:

```sh
npm ci
npm test
```

O `npm ci` instala as versões registradas no `package-lock.json`. Na primeira
instalação, o Cypress também pode precisar baixar seu executável.
Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` no lugar de `npm`.

## Execução

| Comando | Finalidade |
| --- | --- |
| `npm test` | Executar E2E e, se passar, API |
| `npm run test:api` | Executar as três specs de API no Chrome headless |
| `npm run test:e2e` | Executar as três specs E2E no Chrome headless |
| `npm run cy:open` | Abrir a interface do Cypress para os testes E2E |
| `npm run cy:open:api` | Abrir a interface do Cypress para os testes de API |

Para rodar um arquivo específico ou acompanhar o navegador na tela:

```sh
npm run test:api -- --spec cypress/api/usuarios.cy.js
npm run test:e2e -- --headed --spec cypress/e2e/lista-compras.cy.js
```

Na interface do Cypress, escolha o arquivo de teste para acompanhar cada comando.
Pelo terminal, `--headed` deixa o navegador visível; sem essa opção, ele roda em
segundo plano, no modo headless.

## Cobertura

| Spec | Casos | Validações principais |
| --- | ---: | --- |
| `api/usuarios.cy.js` | 13 | Cadastro de ambos os perfis, duplicidade, quatro campos obrigatórios, e-mail inválido, tipo do perfil, senha vazia; edição válida/duplicada e exclusão |
| `api/produtos.cy.js` | 4 | Cadastro por administrador, token ausente, usuário sem permissão, nome duplicado |
| `api/carrinhos.cy.js` | 3 | Criação/cancelamento e estoque, quantidade acima do estoque, bloqueio da exclusão de usuário com carrinho |
| `e2e/cadastro.cy.js` | 3 | Cadastro administrativo de usuário comum, e-mail duplicado e nome não preenchido |
| `e2e/produtos.cy.js` | 3 | Login e cadastro sem imagem, nome duplicado e nome não preenchido |
| `e2e/lista-compras.cy.js` | 1 | Jornada completa entre administrador e comprador |

A jornada completa prepara apenas o administrador via API. Pela interface, ele faz
login, cadastra comprador e produto e confere suas listagens. Após logout, o comprador
recém-criado entra, pesquisa o produto, adiciona à lista e altera a quantidade
**1 → 2 → 1**, conferindo os valores **R$ 125 → R$ 250 → R$ 125**. Por fim, usa
**Limpar Lista** e verifica ausência de itens, inclusive após recarregar a página.

## Organização e manutenção

```text
cypress/
├── api/       # Contratos, permissões e regras de negócio
├── e2e/       # Jornadas reais pelo navegador
├── pages/     # Seletores e ações da interface
└── helpers/
    ├── usuarios.js       # Dados fictícios de usuário com Faker
    ├── produtos.js       # Dados fictícios de produto com Faker
    ├── massa-compras.js  # Dados e preparação da jornada completa
    └── limpeza.js        # Remoção dos dados criados pelos testes
```

As validações ficam nas specs, perto da ação que está sendo testada. Os Page Objects
guardam os seletores e as ações das telas, para que uma mudança na interface possa
ser ajustada em um só lugar.

Os helpers geram dados fictícios com Faker. E-mails e nomes de produtos recebem
UUIDs para reduzir a chance de duplicidade no ambiente público. Nos testes de
quantidade e valor, preço e estoque são definidos pelo próprio caso para permitir
conferir o cálculo esperado.

A limpeza usa os IDs dos registros criados pelo teste e respeita suas dependências:
primeiro o carrinho, depois os produtos e os usuários. Se a API rejeitar uma exclusão,
`limparRecursos` tenta as demais e apresenta os erros ao final. Uma queda de conexão
ou interrupção da execução ainda pode deixar registros no ambiente.

Os intercepts acompanham as chamadas reais, sem substituir respostas. Os testes
aguardam as requisições e os resultados esperados na tela, sem pausas de duração fixa.
Não há tratamento global para ignorar erros da aplicação.

O projeto não precisa de comandos customizados ou arquivos de dados estáticos neste
momento. Por isso, `supportFile` e `fixturesFolder` estão desabilitados.

Ao adicionar um teste, reutilize os geradores e a limpeza, mas deixe clara na spec
a regra que ele verifica. Crie novos helpers quando houver repetição que valha a pena remover.

## Ambientes

- `cypress.config.js`: frontend `https://front.serverest.dev` e API de preparação
  em `expose.apiUrl` (padrão `https://serverest.dev`, configurável por `API_BASE_URL`).
- `cypress.api.config.js`: API `https://serverest.dev` e seleção exclusiva das specs de API.
- `CYPRESS_BASE_URL` substitui a URL base da suíte selecionada. No E2E, a API de
  preparação deve corresponder ao backend utilizado pelo frontend.

Os usuários e as senhas são fictícios e gerados a cada execução. Os testes não
gravam tokens em arquivos. O `.gitignore` mantém dependências, resultados de execução,
logs e configurações locais de segredos fora do versionamento. Use somente dados de
teste ao alterar as configurações ou os geradores.

## O que esta suíte ainda não cobre

- A lista de compras usa armazenamento local. O teste termina com a lista vazia,
  sem concluir uma compra. A tela de carrinho está em construção; suas regras são verificadas na API.
- Durante a execução, o botão “−” manteve o produto quando havia uma unidade.
  Para remover o item, a jornada usa **Limpar Lista**.
- O cadastro sem imagem funcionou, apesar do asterisco no campo. Upload de imagem não é testado.
- As listagens são conferidas pelos registros criados no teste. Não há uma revisão visual de toda a página.
- A seleção cobre as regras descritas na tabela, sem esgotar os campos e endpoints.
  Testes de carga e execução em outros navegadores também ficam fora deste escopo.

Em uma execução anterior, a criação do administrador retornou HTTP 400. A repetição
passou sem alteração de código, e a causa não foi confirmada. Essa ocorrência fica
registrada para investigação caso volte a acontecer.

Contratos consultados: [Swagger do ServeRest](https://serverest.dev/) e
[código do frontend](https://github.com/ServeRest/front).

## Verificação e entrega

Última execução completa: `npm test`, em 25/09/2026, com Node 24.21.0,
Cypress 16.1.0 e Chrome 153 headless: **7 E2E + 20 API aprovados, 0 falhas e 0 pendentes**.
O comando terminou com código 0, incluindo a limpeza dos dados. Esse resultado
registra a execução realizada; não garante que o ambiente público estará sempre disponível.

O ZIP deve incluir o código dos testes, as configurações, `package.json`,
`package-lock.json` e este README. Deixe de fora `node_modules`, `.git`, logs,
screenshots, vídeos, downloads e arquivos locais de segredos. Ao compactar manualmente,
faça essa seleção: o `.gitignore` não exclui arquivos do ZIP.

O repositório ainda não foi publicado e o ZIP ainda não foi gerado.
