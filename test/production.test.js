const assert = require('node:assert/strict');
const test = require('node:test');
const { createStore } = require('../src/stores/create-store');
const { JsonLinkStore } = require('../src/stores/json-link-store');
const { PostgresLinkStore } = require('../src/stores/postgres-link-store');
const { startTestServer } = require('./helpers');

class FakePool {
  constructor(results = []) {
    this.results = [...results];
    this.calls = [];
  }

  async query(text, values) {
    this.calls.push({ text, values });
    const result = this.results.shift();
    if (result instanceof Error) throw result;
    return result || { rows: [] };
  }
}

test('createStore usa JSON local cuando DATABASE_URL no existe', () => {
  const store = createStore({ databaseUrl: '', dataFile: 'data/test-links.json' });
  assert.ok(store instanceof JsonLinkStore);
});

test('createStore usa PostgreSQL cuando DATABASE_URL existe', () => {
  const pool = new FakePool();
  const store = createStore({
    databaseUrl: 'postgresql://user:secret@db.example/corta',
    pool
  });
  assert.ok(store instanceof PostgresLinkStore);
});

test('PostgresLinkStore inicializa un esquema idempotente con código único', async () => {
  const pool = new FakePool();
  const store = new PostgresLinkStore({ pool });

  await store.init();

  assert.equal(pool.calls.length, 1);
  assert.match(pool.calls[0].text, /CREATE TABLE IF NOT EXISTS links/i);
  assert.match(pool.calls[0].text, /codigo\s+TEXT\s+PRIMARY KEY/i);
  assert.match(pool.calls[0].text, /clicks\s+INTEGER/i);
});

test('PostgresLinkStore traduce una violación unique a DUPLICATE_CODE', async () => {
  const duplicate = new Error('duplicate key');
  duplicate.code = '23505';
  const store = new PostgresLinkStore({ pool: new FakePool([duplicate]) });

  await assert.rejects(
    store.create({
      codigo: 'abc123',
      url: 'https://example.com',
      clicks: 0,
      creado: '2026-08-18T15:30:00.000Z'
    }),
    (error) => error.code === 'DUPLICATE_CODE'
  );
});

test('PostgresLinkStore incrementa clicks con una sola operación atómica', async () => {
  const pool = new FakePool([{ rows: [{
    codigo: 'abc123',
    url: 'https://example.com',
    clicks: 4,
    creado: new Date('2026-08-18T15:30:00.000Z')
  }] }]);
  const store = new PostgresLinkStore({ pool });

  const updated = await store.incrementClicks('abc123');

  assert.match(pool.calls[0].text, /SET clicks = clicks \+ 1/i);
  assert.match(pool.calls[0].text, /RETURNING/i);
  assert.equal(updated.clicks, 4);
  assert.equal(updated.creado, '2026-08-18T15:30:00.000Z');
});

test('GET /health confirma que la aplicación está lista', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
