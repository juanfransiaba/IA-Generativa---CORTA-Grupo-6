const { createApplication } = require('../src/composition/create-application');
const { FailureReason, failure, success } = require('../src/application/result');
const { toImmutableShortLink } = require('../src/domain/short-link');

function normalizeTestLink(link) {
  return toImmutableShortLink({
    shortCode: link.shortCode ?? link.codigo,
    originalUrl: link.originalUrl ?? link.url,
    clickCount: link.clickCount ?? link.clicks,
    createdAt: link.createdAt ?? link.creado
  });
}

class MemoryLinkRepository {
  constructor(initialLinks = []) {
    const immutableLinks = initialLinks.map(normalizeTestLink);
    this.links = new Map(immutableLinks.map((link) => [link.shortCode, link]));
  }

  async initialize() {}

  async save(shortLink) {
    if (this.links.has(shortLink.shortCode)) {
      return failure(FailureReason.SHORT_CODE_COLLISION);
    }

    const immutableLink = toImmutableShortLink(shortLink);
    this.links.set(immutableLink.shortCode, immutableLink);
    return success(immutableLink);
  }

  async findByShortCode(shortCode) {
    const shortLink = this.links.get(shortCode);
    return shortLink
      ? success(shortLink)
      : failure(FailureReason.SHORT_LINK_NOT_FOUND);
  }

  async incrementClickCount(shortCode) {
    const currentLink = this.links.get(shortCode);
    if (!currentLink) return failure(FailureReason.SHORT_LINK_NOT_FOUND);

    const updatedLink = toImmutableShortLink({
      ...currentLink,
      clickCount: currentLink.clickCount + 1
    });
    this.links.set(shortCode, updatedLink);
    return success(updatedLink);
  }
}

async function startTestServer(options = {}) {
  const linkRepository = options.linkRepository
    || new MemoryLinkRepository(options.initialLinks);
  const codes = [...(options.codes || ['abc123'])];
  const shortCodeGenerator = options.shortCodeGenerator
    || (() => codes.shift() || 'abc123');
  const clock = options.clock || (() => '2026-08-18T15:30:00.000Z');
  const app = createApplication({
    linkRepository,
    shortCodeGenerator,
    clock,
    maxCodeAttempts: options.maxCodeAttempts,
    logger: { error() {} }
  });

  await linkRepository.initialize();
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    linkRepository,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual'
  });
}

module.exports = { MemoryLinkRepository, postJson, startTestServer };
