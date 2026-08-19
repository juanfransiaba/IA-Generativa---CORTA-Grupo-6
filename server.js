const path = require('node:path');
const { createApp } = require('./src/app');
const { JsonLinkStore } = require('./src/stores/json-link-store');

async function main() {
  const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'links.json');
  const store = new JsonLinkStore(dataFile);
  await store.init();

  const app = createApp({ store });
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Corta escuchando en http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('No se pudo iniciar Corta:', error);
  process.exitCode = 1;
});
