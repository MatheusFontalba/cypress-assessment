module.exports = function configurarRelatorios(suite) {
  // Cada execução tem sua pasta, para não misturar resultados antigos com os novos.
  const execucao = new Date().toISOString().replace(/[:.]/g, '-');
  const pasta = `reports/${suite}/${execucao}`;

  return {
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'spec, mochawesome, mocha-junit-reporter',
      mochawesomeReporterOptions: {
        reportDir: `${pasta}/html`,
        reportFilename: '[name]',
        overwrite: false,
        html: true,
        json: false,
        inlineAssets: true,
        charts: true,
        consoleReporter: 'none',
      },
      mochaJunitReporterReporterOptions: {
        // O hash impede que uma spec sobrescreva o XML de outra.
        mochaFile: `${pasta}/xml/resultados-[hash].xml`,
      },
    },
  };
};
