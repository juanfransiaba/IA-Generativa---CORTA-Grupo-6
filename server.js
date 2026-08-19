const path = require('node:path');
const { createApplication } = require('./src/composition/create-application');
const {
  createLinkRepository
} = require('./src/infrastructure/repositories/create-link-repository');
const {
  generateRandomShortCode
} = require('./src/infrastructure/random/generate-random-short-code');

async function main() {
  const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'links.json');
  const linkRepository = createLinkRepository({
    databaseUrl: process.env.DATABASE_URL,
    dataFile
  });
  await linkRepository.initialize();

  const app = createApplication({
    linkRepository,
    shortCodeGenerator: generateRandomShortCode,
    clock: () => new Date().toISOString(),
    logger: console
  });
  const port = Number(process.env.PORT) || 3000;
  const httpServer = app.listen(port, () => {
    console.log(`Corta escuchando en http://localhost:${port}`);
  });

  let isShuttingDown = false;
  async function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    await new Promise((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    if (typeof linkRepository.close === 'function') await linkRepository.close();
  }

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}

main().catch((error) => {
  console.error('No se pudo iniciar Corta', { errorType: error.name });
  process.exitCode = 1;
});
