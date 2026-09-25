const { defineConfig } = require("cypress");

module.exports = defineConfig({
  expose: {
    apiUrl: process.env.API_BASE_URL || "https://serverest.dev",
  },
  e2e: {
    baseUrl: "https://front.serverest.dev",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false,
    fixturesFolder: false,
  },
});
