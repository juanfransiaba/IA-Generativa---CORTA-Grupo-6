const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createLinkRepository
} = require('../src/infrastructure/repositories/create-link-repository');
const {
  JsonLinkRepository
} = require('../src/infrastructure/repositories/json-link-repository');
const {
  PostgresLinkRepository
} = require('../src/infrastructure/repositories/postgres-link-repository');
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

test('createLinkRepository usa JSON local cuando DATABASE_URL no existe', () => {
  const repository = createLinkRepository({
    databaseUrl: '',
    dataFile: 'data/test-links.json'
  });
  assert.ok(repository instanceof JsonLinkRepository);
});

test('createLinkRepository usa PostgreSQL cuando DATABASE_URL existe', () => {
  const pool = new FakePool();
  const repository = createLinkRepository({
    databaseUrl: 'configured-by-environment',
    pool
  });
  assert.ok(repository instanceof PostgresLinkRepository);
});

test('PostgresLinkRepository inicializa un esquema idempotente con código único', async () => {
  const pool = new FakePool();
  const repository = new PostgresLinkRepository({ pool });

  await repository.initialize();

  assert.equal(pool.calls.length, 1);
  assert.match(pool.calls[0].text, /CREATE TABLE IF NOT EXISTS links/i);
  assert.match(pool.calls[0].text, /codigo\s+TEXT\s+PRIMARY KEY/i);
  assert.match(pool.calls[0].text, /clicks\s+INTEGER/i);
});

test('PostgresLinkRepository traduce una violación unique a error de dominio', async () => {
  const duplicate = new Error('duplicate key');
  duplicate.code = '23505';
  const repository = new PostgresLinkRepository({ pool: new FakePool([duplicate]) });

  await assert.rejects(
    repository.save({
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      clickCount: 0,
      createdAt: '2026-08-18T15:30:00.000Z'
    }),
    (error) => error.name === 'ShortCodeCollisionError'
  );
});

test('PostgresLinkRepository incrementa clicks con una sola operación atómica', async () => {
  const pool = new FakePool([{ rows: [{
    codigo: 'abc123',
    url: 'https://example.com',
    clicks: 4,
    creado: new Date('2026-08-18T15:30:00.000Z')
  }] }]);
  const repository = new PostgresLinkRepository({ pool });

  const updated = await repository.incrementClickCount('abc123');

  assert.match(pool.calls[0].text, /SET clicks = clicks \+ 1/i);
  assert.match(pool.calls[0].text, /RETURNING/i);
  assert.equal(updated.clickCount, 4);
  assert.equal(updated.createdAt, '2026-08-18T15:30:00.000Z');
});

test('GET /health confirma que la aplicación está lista', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
