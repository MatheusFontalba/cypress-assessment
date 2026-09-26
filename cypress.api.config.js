const { defineConfig } = require("cypress");
const configurarRelatorios = require('./reporters.config');

module.exports = defineConfig({
  ...configurarRelatorios('api'),
  e2e: {
    baseUrl: "https://serverest.dev",
    specPattern: "cypress/api/**/*.cy.js",
    supportFile: false,
    fixturesFolder: false,
  },
});
