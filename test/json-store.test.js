const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { JsonLinkStore } = require('../src/stores/json-link-store');

async function temporaryStore(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'corta-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'links.json');
  const store = new JsonLinkStore(filePath);
  await store.init();
  return { filePath, store };
}

const link = {
  codigo: 'abc123',
  url: 'https://example.com',
  clicks: 0,
  creado: '2026-08-18T15:30:00.000Z'
};

test('JsonLinkStore conserva links y clicks después de reiniciarse', async (t) => {
  const { filePath, store } = await temporaryStore(t);
  await store.create(link);
  await store.incrementClicks('abc123');

  const restartedStore = new JsonLinkStore(filePath);
  await restartedStore.init();

  assert.equal((await restartedStore.findByCode('abc123')).clicks, 1);
});

test('JsonLinkStore rechaza códigos duplicados sin sobrescribir', async (t) => {
  const { store } = await temporaryStore(t);
  await store.create(link);

  await assert.rejects(
    store.create({ ...link, url: 'https://otra.example' }),
    (error) => error.code === 'DUPLICATE_CODE'
  );
  assert.equal((await store.findByCode('abc123')).url, 'https://example.com');
});

test('JsonLinkStore no pierde clicks concurrentes', async (t) => {
  const { store } = await temporaryStore(t);
  await store.create(link);

  await Promise.all(Array.from({ length: 25 }, () => store.incrementClicks('abc123')));

  assert.equal((await store.findByCode('abc123')).clicks, 25);
});
