const fileSystem = require('node:fs/promises');
const path = require('node:path');
const { ShortCodeCollisionError } = require('../../domain/errors');
const { toImmutableShortLink } = require('../../domain/short-link');

function normalizePersistedShortLink(record) {
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
    const fileContents = await fileSystem.readFile(this.filePath, 'utf8');
    const persistedRecords = JSON.parse(fileContents);
    if (!Array.isArray(persistedRecords)) {
      throw new Error('El archivo de links no contiene una lista');
    }
    return persistedRecords.map(normalizePersistedShortLink);
  }

  async writeAll(shortLinks) {
    const temporaryPath = `${this.filePath}.tmp`;
    const serializedLinks = `${JSON.stringify(shortLinks, null, 2)}\n`;
    await fileSystem.writeFile(temporaryPath, serializedLinks, 'utf8');
    await fileSystem.rename(temporaryPath, this.filePath);
  }

  enqueueMutation(operation) {
    const result = this.pendingMutation.then(operation);
    this.pendingMutation = result.catch(() => {});
    return result;
  }

  async findByShortCode(shortCode) {
    await this.pendingMutation;
    const shortLink = (await this.readAll()).find(
      (candidate) => candidate.shortCode === shortCode
    );
    return shortLink || null;
  }

  async save(shortLink) {
    return this.enqueueMutation(async () => {
      const shortLinks = await this.readAll();
      const codeAlreadyExists = shortLinks.some(
        (candidate) => candidate.shortCode === shortLink.shortCode
      );
      if (codeAlreadyExists) throw new ShortCodeCollisionError();

      const immutableLink = toImmutableShortLink(shortLink);
      await this.writeAll([...shortLinks, immutableLink]);
      return immutableLink;
    });
  }

  async incrementClickCount(shortCode) {
    return this.enqueueMutation(async () => {
      const shortLinks = await this.readAll();
      const matchingLink = shortLinks.find((candidate) => candidate.shortCode === shortCode);
      if (!matchingLink) return null;

      const updatedLink = toImmutableShortLink({
        ...matchingLink,
        clickCount: matchingLink.clickCount + 1
      });
      const updatedLinks = shortLinks.map((candidate) => (
        candidate.shortCode === shortCode ? updatedLink : candidate
      ));
      await this.writeAll(updatedLinks);
      return updatedLink;
    });
  }
}

module.exports = { JsonLinkRepository, normalizePersistedShortLink };
