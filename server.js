const path = require('node:path');
const { createApp } = require('./src/app');
const { createStore } = require('./src/stores/create-store');

async function main() {
  const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'links.json');
  const store = createStore({ dataFile });
  await store.init();

  const app = createApp({ store });
  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`Corta escuchando en http://localhost:${port}`);
  });

  async function shutdown() {
    server.close(async () => {
      if (typeof store.close === 'function') await store.close();
      process.exit(0);
    });
  }

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('No se pudo iniciar Corta:', error);
  process.exitCode = 1;
});
