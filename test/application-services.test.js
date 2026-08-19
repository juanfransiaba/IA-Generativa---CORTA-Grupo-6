const assert = require('node:assert/strict');
const test = require('node:test');
const {
  FailureReason,
  LinkService
} = require('../src/services/link-service');

class RepositorySpy {
  constructor() {
    this.links = new Map();
    this.incrementedCodes = [];
  }

  async save(shortLink) {
    if (this.links.has(shortLink.shortCode)) return false;
    this.links.set(shortLink.shortCode, shortLink);
    return true;
  }

  async findByShortCode(shortCode) {
    return this.links.get(shortCode) || null;
  }

  async incrementClickCount(shortCode) {
    this.incrementedCodes.push(shortCode);
    const current = this.links.get(shortCode);
    if (!current) return null;

    const updated = Object.freeze({
      ...current,
      clickCount: current.clickCount + 1
    });
    this.links.set(shortCode, updated);
    return updated;
  }
}

test('LinkService normaliza la URL y crea un modelo inmutable', async () => {
  const repository = new RepositorySpy();
  const service = new LinkService({
    repository,
    generateCode: () => 'abc123',
    clock: () => '2026-08-18T15:30:00.000Z'
  });

  const result = await service.create('  https://example.com/ruta  ');
  const created = result.value;

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(created, {
    shortCode: 'abc123',
    originalUrl: 'https://example.com/ruta',
    clickCount: 0,
    createdAt: '2026-08-18T15:30:00.000Z'
  });
  assert.equal(Object.isFrozen(created), true);
  assert.strictEqual(await repository.findByShortCode('abc123'), created);
});

test('LinkService rechaza URLs que no sean HTTP(S) absolutas', async () => {
  const service = new LinkService({
    repository: new RepositorySpy(),
    generateCode: () => 'abc123',
    clock: () => '2026-08-18T15:30:00.000Z'
  });

  const result = await service.create('ftp://example.com');
  assert.deepEqual(result, { ok: false, reason: FailureReason.INVALID_ORIGINAL_URL });
});

test('LinkService reintenta una colisión sin sobrescribir', async () => {
  const repository = new RepositorySpy();
  repository.links.set('ocupado', Object.freeze({
    shortCode: 'ocupado',
    originalUrl: 'https://original.example',
    clickCount: 4,
    createdAt: '2026-01-01T00:00:00.000Z'
  }));
  const codes = ['ocupado', 'disponible'];
  const service = new LinkService({
    repository,
    generateCode: () => codes.shift(),
    clock: () => '2026-08-18T15:30:00.000Z'
  });

  const result = await service.create('https://nuevo.example');
  const created = result.value;

  assert.equal(result.ok, true);
  assert.equal(created.shortCode, 'disponible');
  assert.equal((await repository.findByShortCode('ocupado')).clickCount, 4);
});

test('LinkService informa el agotamiento de códigos', async () => {
  const repository = new RepositorySpy();
  repository.links.set('ocupado', Object.freeze({ shortCode: 'ocupado' }));
  const service = new LinkService({
    repository,
    generateCode: () => 'ocupado',
    clock: () => '2026-08-18T15:30:00.000Z',
    maxCodeAttempts: 2
  });

  assert.deepEqual(await service.create('https://nuevo.example'), {
    ok: false,
    reason: FailureReason.SHORT_CODE_GENERATION_EXHAUSTED
  });
});

test('LinkService consulta estadísticas sin incrementar clicks', async () => {
  const repository = new RepositorySpy();
  const link = Object.freeze({
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    clickCount: 7,
    createdAt: '2026-01-01T00:00:00.000Z'
  });
  repository.links.set(link.shortCode, link);
  const service = new LinkService({ repository });

  const result = await service.getStatistics('abc123');

  assert.equal(result.ok, true);
  assert.strictEqual(result.value, link);
  assert.deepEqual(repository.incrementedCodes, []);
});

test('LinkService informa códigos inexistentes al consultar', async () => {
  const service = new LinkService({ repository: new RepositorySpy() });

  assert.deepEqual(await service.getStatistics('noexiste'), {
    ok: false,
    reason: FailureReason.SHORT_LINK_NOT_FOUND
  });
});

test('LinkService delega un único incremento atómico al resolver', async () => {
  const repository = new RepositorySpy();
  repository.links.set('abc123', Object.freeze({
    shortCode: 'abc123',
    originalUrl: 'https://example.com/destino',
    clickCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  }));
  const service = new LinkService({ repository });

  const result = await service.resolve('abc123');

  assert.equal(result.ok, true);
  assert.equal(result.value.originalUrl, 'https://example.com/destino');
  assert.equal(result.value.clickCount, 1);
  assert.deepEqual(repository.incrementedCodes, ['abc123']);
});
