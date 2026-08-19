const assert = require('node:assert/strict');
const test = require('node:test');
const {
  InvalidOriginalUrlError,
  ShortCodeCollisionError,
  ShortCodeGenerationExhaustedError,
  ShortLinkNotFoundError
} = require('../src/domain/errors');
const {
  CreateShortLinkService
} = require('../src/application/services/create-short-link-service');
const {
  GetShortLinkStatisticsService
} = require('../src/application/services/get-short-link-statistics-service');
const {
  ResolveShortLinkService
} = require('../src/application/services/resolve-short-link-service');

class RepositorySpy {
  constructor() {
    this.links = new Map();
    this.incrementedCodes = [];
  }

  async save(shortLink) {
    if (this.links.has(shortLink.shortCode)) throw new ShortCodeCollisionError();
    this.links.set(shortLink.shortCode, shortLink);
    return shortLink;
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

test('CreateShortLinkService normaliza la URL y crea un modelo inmutable', async () => {
  const repository = new RepositorySpy();
  const service = new CreateShortLinkService({
    linkRepository: repository,
    shortCodeGenerator: () => 'abc123',
    clock: () => new Date('2026-08-18T15:30:00.000Z')
  });

  const created = await service.execute('  https://example.com/ruta  ');

  assert.deepEqual(created, {
    shortCode: 'abc123',
    originalUrl: 'https://example.com/ruta',
    clickCount: 0,
    createdAt: '2026-08-18T15:30:00.000Z'
  });
  assert.equal(Object.isFrozen(created), true);
  assert.strictEqual(await repository.findByShortCode('abc123'), created);
});

test('CreateShortLinkService rechaza URLs que no sean HTTP(S) absolutas', async () => {
  const service = new CreateShortLinkService({
    linkRepository: new RepositorySpy(),
    shortCodeGenerator: () => 'abc123'
  });

  await assert.rejects(service.execute('ftp://example.com'), InvalidOriginalUrlError);
});

test('CreateShortLinkService reintenta una colisión sin sobrescribir', async () => {
  const repository = new RepositorySpy();
  repository.links.set('ocupado', Object.freeze({
    shortCode: 'ocupado',
    originalUrl: 'https://original.example',
    clickCount: 4,
    createdAt: '2026-01-01T00:00:00.000Z'
  }));
  const codes = ['ocupado', 'disponible'];
  const service = new CreateShortLinkService({
    linkRepository: repository,
    shortCodeGenerator: () => codes.shift(),
    clock: () => new Date('2026-08-18T15:30:00.000Z')
  });

  const created = await service.execute('https://nuevo.example');

  assert.equal(created.shortCode, 'disponible');
  assert.equal((await repository.findByShortCode('ocupado')).clickCount, 4);
});

test('CreateShortLinkService informa el agotamiento de códigos', async () => {
  const repository = new RepositorySpy();
  repository.links.set('ocupado', Object.freeze({ shortCode: 'ocupado' }));
  const service = new CreateShortLinkService({
    linkRepository: repository,
    shortCodeGenerator: () => 'ocupado',
    maxCodeAttempts: 2
  });

  await assert.rejects(
    service.execute('https://nuevo.example'),
    ShortCodeGenerationExhaustedError
  );
});

test('GetShortLinkStatisticsService consulta sin incrementar clicks', async () => {
  const repository = new RepositorySpy();
  const link = Object.freeze({
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    clickCount: 7,
    createdAt: '2026-01-01T00:00:00.000Z'
  });
  repository.links.set(link.shortCode, link);
  const service = new GetShortLinkStatisticsService({ linkRepository: repository });

  const result = await service.execute('abc123');

  assert.strictEqual(result, link);
  assert.deepEqual(repository.incrementedCodes, []);
});

test('GetShortLinkStatisticsService informa códigos inexistentes', async () => {
  const service = new GetShortLinkStatisticsService({
    linkRepository: new RepositorySpy()
  });

  await assert.rejects(service.execute('noexiste'), ShortLinkNotFoundError);
});

test('ResolveShortLinkService delega un único incremento atómico', async () => {
  const repository = new RepositorySpy();
  repository.links.set('abc123', Object.freeze({
    shortCode: 'abc123',
    originalUrl: 'https://example.com/destino',
    clickCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  }));
  const service = new ResolveShortLinkService({ linkRepository: repository });

  const result = await service.execute('abc123');

  assert.equal(result.originalUrl, 'https://example.com/destino');
  assert.equal(result.clickCount, 1);
  assert.deepEqual(repository.incrementedCodes, ['abc123']);
});
