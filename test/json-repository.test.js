const assert = require('node:assert/strict');
const fileSystem = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  JsonLinkRepository
} = require('../src/repositories/json-link-repository');

async function temporaryRepository(t) {
  const directory = await fileSystem.mkdtemp(path.join(os.tmpdir(), 'corta-test-'));
  t.after(() => fileSystem.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'links.json');
  const repository = new JsonLinkRepository(filePath);
  await repository.initialize();
  return { filePath, repository };
}

const link = Object.freeze({
  shortCode: 'abc123',
  originalUrl: 'https://example.com',
  clickCount: 0,
  createdAt: '2026-08-18T15:30:00.000Z'
});

test('JsonLinkRepository conserva links y clicks después de reiniciarse', async (t) => {
  const { filePath, repository } = await temporaryRepository(t);
  await repository.save(link);
  await repository.incrementClickCount('abc123');

  const restartedRepository = new JsonLinkRepository(filePath);
  await restartedRepository.initialize();

  assert.equal((await restartedRepository.findByShortCode('abc123')).clickCount, 1);
});

test('JsonLinkRepository rechaza códigos duplicados sin sobrescribir', async (t) => {
  const { repository } = await temporaryRepository(t);
  await repository.save(link);

  const wasSaved = await repository.save({
    ...link,
    originalUrl: 'https://otra.example'
  });
  assert.equal(wasSaved, false);
  assert.equal(
    (await repository.findByShortCode('abc123')).originalUrl,
    'https://example.com'
  );
});

test('JsonLinkRepository no pierde clicks concurrentes', async (t) => {
  const { repository } = await temporaryRepository(t);
  await repository.save(link);

  await Promise.all(
    Array.from({ length: 25 }, () => repository.incrementClickCount('abc123'))
  );

  assert.equal(
    (await repository.findByShortCode('abc123')).clickCount,
    25
  );
});
