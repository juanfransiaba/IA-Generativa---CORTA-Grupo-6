const fileSystem = require('node:fs/promises');
const path = require('node:path');
const { toImmutableShortLink } = require('../short-link');

function normalizePersistedLink(record) {
  return toImmutableShortLink({
    shortCode: record.shortCode ?? record.codigo,
    originalUrl: record.originalUrl ?? record.url,
    clickCount: record.clickCount ?? record.clicks,
    createdAt: record.createdAt ?? record.creado
  });
}

class JsonLinkRepository {
  constructor(filePath) {
    this.filePath = filePath;
    this.pendingMutation = Promise.resolve();
  }

  async initialize() {
    await fileSystem.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fileSystem.access(this.filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.writeAll([]);
    }
  }

  async readAll() {
    const records = JSON.parse(await fileSystem.readFile(this.filePath, 'utf8'));
    if (!Array.isArray(records)) throw new Error('El archivo de links no contiene una lista');
    return records.map(normalizePersistedLink);
  }

  async writeAll(shortLinks) {
    const temporaryPath = `${this.filePath}.tmp`;
    await fileSystem.writeFile(
      temporaryPath,
      `${JSON.stringify(shortLinks, null, 2)}\n`,
      'utf8'
    );
    await fileSystem.rename(temporaryPath, this.filePath);
  }

  enqueueMutation(operation) {
    const result = this.pendingMutation.then(operation);
    this.pendingMutation = result.catch(() => {});
    return result;
  }

  async findByShortCode(shortCode) {
    await this.pendingMutation;
    return (await this.readAll()).find((link) => link.shortCode === shortCode) || null;
  }

  async save(shortLink) {
    return this.enqueueMutation(async () => {
      const shortLinks = await this.readAll();
      if (shortLinks.some((link) => link.shortCode === shortLink.shortCode)) return false;
      await this.writeAll([...shortLinks, toImmutableShortLink(shortLink)]);
      return true;
    });
  }

  async incrementClickCount(shortCode) {
    return this.enqueueMutation(async () => {
      const shortLinks = await this.readAll();
      const currentLink = shortLinks.find((link) => link.shortCode === shortCode);
      if (!currentLink) return null;

      const updatedLink = toImmutableShortLink({
        ...currentLink,
        clickCount: currentLink.clickCount + 1
      });
      await this.writeAll(shortLinks.map((link) => (
        link.shortCode === shortCode ? updatedLink : link
      )));
      return updatedLink;
    });
  }
}

module.exports = { JsonLinkRepository };
