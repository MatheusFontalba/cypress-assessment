const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://serverest.dev",
    specPattern: "cypress/api/**/*.cy.js",
    supportFile: false,
    fixturesFolder: false,
  },
});
