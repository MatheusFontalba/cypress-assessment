# ServeRest — automação com Cypress

Suíte de testes do ServeRest feita com JavaScript e Cypress. Os testes cobrem gestão
de usuários, cadastro de produtos, regras de carrinho e a jornada do administrador
até a lista de compras do comprador.

São **20 testes de API e 7 E2E**, organizados em três funcionalidades por camada.
Cada teste prepara os dados de que precisa e pode ser executado sozinho.
A jornada entre administrador e comprador fica em um único teste, porque suas
etapas fazem parte do mesmo fluxo.

O escopo está organizado em três funcionalidades de API e três de interface,
com testes separados para os casos de sucesso e de erro. Isso resulta em mais de
três casos por camada. A lista de compras cobre o caminho feliz completo.

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

### Como reproduzir os testes da entrega

Abra o terminal na pasta `ServerRest Cypress Project`, onde está o `package.json`.
Antes da primeira execução, rode `npm ci`. Os exemplos abaixo usam `npm.cmd` para
funcionar no PowerShell sem depender da permissão para executar `npm.ps1`.
Em Linux ou macOS, use `npm` no lugar de `npm.cmd`.

#### 1. As três funcionalidades de API

```powershell
npm.cmd run test:api
```

Executa usuários (`usuarios.cy.js`), produtos (`produtos.cy.js`) e carrinhos
(`carrinhos.cy.js`), com **20 testes no total**. O resultado aparece no terminal;
o Chrome roda sem abrir uma janela visível.

Para executar apenas uma delas, escolha o comando correspondente:

```powershell
npm.cmd run test:api -- --spec cypress/api/usuarios.cy.js
npm.cmd run test:api -- --spec cypress/api/produtos.cy.js
npm.cmd run test:api -- --spec cypress/api/carrinhos.cy.js
```

#### 2. As três funcionalidades pela interface gráfica

```powershell
npm.cmd run test:e2e -- --headed
```

Abre o Chrome e executa cadastro administrativo de usuários (`cadastro.cy.js`),
cadastro de produtos (`produtos.cy.js`) e lista de compras (`lista-compras.cy.js`).
São **7 testes no total**. O navegador é controlado pelo Cypress; basta acompanhar
a execução e conferir o resultado no terminal.

Para acompanhar uma funcionalidade por vez:

```powershell
npm.cmd run test:e2e -- --headed --spec cypress/e2e/cadastro.cy.js
npm.cmd run test:e2e -- --headed --spec cypress/e2e/produtos.cy.js
npm.cmd run test:e2e -- --headed --spec cypress/e2e/lista-compras.cy.js
```

#### 3. A jornada completa: administrador e comprador

```powershell
npm.cmd run test:e2e -- --headed --spec cypress/e2e/lista-compras.cy.js
```

Executa **um teste positivo**: prepara o administrador via API, faz login pela tela,
cadastra comprador e produto, confere as listagens, troca para o comprador e adiciona
o produto à lista. Depois altera a quantidade, confere os valores, limpa a lista e
verifica que ela continua vazia após recarregar a página.

Essa jornada já faz parte da rotina E2E acima; este comando permite rodá-la sozinha.
Ela termina na lista de compras, sem concluir uma compra no carrinho.

Os testes geram os próprios dados e tentam removê-los ao final. Não é necessário
cadastrar contas ou produtos manualmente. Espere o comando terminar para que a
limpeza também seja executada.

Para executar **toda a entrega**, E2E e API, use:

```powershell
npm.cmd test
```

São **27 testes**. A etapa de API só começa se a etapa E2E passar. Ao final, confira
os resumos de cada suíte: `Passing` indica os aprovados e `Failing` aponta falhas.
Para considerar a execução completa aprovada, os 27 testes devem passar e o comando
deve terminar com código 0. Se houver falha, leia o erro no terminal; screenshots de
falhas E2E ficam em `cypress/screenshots`.

Na interface do Cypress, escolha o arquivo de teste para acompanhar cada comando.
Pelo terminal, `--headed` deixa o navegador visível; sem essa opção, ele roda em
segundo plano, no modo headless.

## Relatórios HTML e XML

Os comandos de execução pelo terminal já geram os dois formatos, inclusive com
`--headed` ou `--spec`. Não é necessário executar os testes novamente para cada formato:

```powershell
npm.cmd run test:api
npm.cmd run test:e2e
```

Para executar as duas suítes, use `npm.cmd test`. A API só começa se
o E2E passar. Os relatórios mostram apenas os testes que foram executados.

| Formato | Onde encontrar | Como usar |
| :--- | :--- | :--- |
| HTML (Mochawesome) | `reports/<suite>/<data-hora>/html/` | Abra o arquivo `.html` no navegador para ver testes, tempos e falhas. |
| XML (JUnit) | `reports/<suite>/<data-hora>/xml/` | Importe os arquivos em uma ferramenta de CI compatível com JUnit. |

`<suite>` é `api` ou `e2e`. Cada execução ganha uma pasta com data e hora UTC e
gera um HTML e um XML por spec. Assim, uma execução não apaga a anterior e os
resultados de API e E2E ficam separados. O caminho do HTML também aparece no terminal.

O HTML inclui seus próprios recursos e pode ser aberto offline. Screenshots
continuam em `cypress/screenshots`; não são incorporados ao relatório.
Os relatórios são gerados por `cypress run`, não pela interface `cy:open`.
Uma interrupção antes de a spec terminar pode impedir a geração do seu relatório.

A configuração compartilhada fica em `reporters.config.js`. O
`cypress-multi-reporters` mantém a saída do terminal e aciona o Mochawesome e o
reporter JUnit na mesma execução. Referência: [reporters do Cypress](https://docs.cypress.io/app/tooling/reporters).
A pasta `reports/` está no `.gitignore`; você pode removê-la quando não precisar
mais do histórico. Não há envio automático dos relatórios para serviços externos.

## Cobertura

As tabelas separam os caminhos de sucesso das tentativas que a aplicação deve
recusar. Nos testes negativos, o resultado esperado é a rejeição da operação.

Os títulos no Cypress seguem os nomes das tabelas abaixo. Nos casos agrupados,
o título recebe o perfil ou o campo ao final para identificar cada execução.

### API — 20 testes

Arquivos em `cypress/api/`.

**Positivos — 6 testes**

| Arquivo | Cenário | Quantidade |
| :--- | :--- | ---: |
| `usuarios.cy.js` | Cadastrar administrador e usuário comum | 2 |
| `usuarios.cy.js` | Editar os dados e o perfil do usuário | 1 |
| `usuarios.cy.js` | Excluir usuário sem carrinho e confirmar sua ausência | 1 |
| `produtos.cy.js` | Administrador cadastrar produto e consultar os dados | 1 |
| `carrinhos.cy.js` | Criar e cancelar carrinho, restaurando o estoque | 1 |

**Negativos — 14 testes**

| Arquivo | Cenário | Quantidade |
| :--- | :--- | ---: |
| `usuarios.cy.js` | Recusar cadastro com e-mail duplicado | 1 |
| `usuarios.cy.js` | Recusar ausência de nome, e-mail, senha ou perfil — um teste por campo | 4 |
| `usuarios.cy.js` | Recusar e-mail malformado | 1 |
| `usuarios.cy.js` | Recusar perfil booleano em vez de string | 1 |
| `usuarios.cy.js` | Recusar senha vazia | 1 |
| `usuarios.cy.js` | Recusar edição com e-mail de outro usuário | 1 |
| `produtos.cy.js` | Recusar cadastro sem token | 1 |
| `produtos.cy.js` | Recusar cadastro por usuário comum autenticado | 1 |
| `produtos.cy.js` | Recusar nome de produto duplicado | 1 |
| `carrinhos.cy.js` | Recusar quantidade acima do estoque disponível | 1 |
| `carrinhos.cy.js` | Impedir exclusão de usuário com carrinho | 1 |

### Interface (E2E) — 7 testes

Arquivos em `cypress/e2e/`.

**Positivos — 3 testes**

| Arquivo | Cenário | Quantidade |
| :--- | :--- | ---: |
| `cadastro.cy.js` | Administrador cadastrar usuário comum e conferir a listagem | 1 |
| `produtos.cy.js` | Fazer login, cadastrar produto sem imagem e conferir a listagem | 1 |
| `lista-compras.cy.js` | Completar a jornada do administrador até a lista vazia do comprador | 1 |

**Negativos — 4 testes**

| Arquivo | Cenário | Quantidade |
| :--- | :--- | ---: |
| `cadastro.cy.js` | Exibir erro para e-mail duplicado | 1 |
| `cadastro.cy.js` | Exibir erro quando o nome do usuário não for preenchido | 1 |
| `produtos.cy.js` | Exibir erro para nome de produto duplicado | 1 |
| `produtos.cy.js` | Exibir erro quando o nome do produto não for preenchido | 1 |

**Total: 27 testes — 9 positivos e 18 negativos.** A lista de compras tem apenas
o positivo descrito abaixo.

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

Os dados são gerados nos helpers e as ações de tela ficam nos Page Objects.
Como não há comandos customizados nem fixtures, `supportFile` e `fixturesFolder`
estão desabilitados nas configurações.

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

Última execução completa: `npm test`, em 26/09/2026, com Node 24.21.0,
Cypress 16.1.0 e Chrome 153 headless: **7 E2E + 20 API aprovados, 0 falhas e 0 pendentes**.
O comando terminou com código 0, incluindo a limpeza dos dados. Como o ServeRest
é um ambiente público, novas execuções podem encontrar mudanças ou indisponibilidade.
Essa execução também gerou seis relatórios HTML e seis XML, um de cada por spec.

O ZIP da entrega contém os arquivos versionados: testes, helpers, Page Objects,
configurações, `package.json`, `package-lock.json` e este README. Dependências,
logs e resultados de execução ficam de fora. Após extrair, abra o terminal na
pasta do projeto e rode `npm ci` seguido de `npm test`.
