const { createApp } = require('../src/app');

class MemoryLinkStore {
  constructor(initialLinks = []) {
    this.links = new Map(initialLinks.map((link) => [link.codigo, { ...link }]));
  }

  async init() {}

  async create(link) {
    if (this.links.has(link.codigo)) {
      const error = new Error('El código ya existe');
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    this.links.set(link.codigo, { ...link });
    return { ...link };
  }

  async findByCode(codigo) {
    const link = this.links.get(codigo);
    return link ? { ...link } : null;
  }

  async incrementClicks(codigo) {
    const link = this.links.get(codigo);
    if (!link) return null;
    link.clicks += 1;
    return { ...link };
  }
}

async function startTestServer(options = {}) {
  const store = options.store || new MemoryLinkStore(options.initialLinks);
  const codes = [...(options.codes || ['abc123'])];
  const generateCode = options.generateCode || (() => codes.shift() || 'abc123');
  const now = options.now || (() => new Date('2026-08-18T15:30:00.000Z'));
  const app = createApp({
    store,
    generateCode,
    now,
    maxCodeAttempts: options.maxCodeAttempts
  });

  await store.init();
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    store,
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

module.exports = { MemoryLinkStore, postJson, startTestServer };
