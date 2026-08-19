const fs = require('node:fs/promises');
const path = require('node:path');

class JsonLinkStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.pendingWrite = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.write([]);
    }
  }

  async read() {
    const contents = await fs.readFile(this.filePath, 'utf8');
    const links = JSON.parse(contents);
    if (!Array.isArray(links)) throw new Error('El archivo de links no contiene una lista');
    return links;
  }

  async write(links) {
    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(links, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, this.filePath);
  }

  enqueue(operation) {
    const result = this.pendingWrite.then(operation);
    this.pendingWrite = result.catch(() => {});
    return result;
  }

  async findByCode(codigo) {
    await this.pendingWrite;
    const link = (await this.read()).find((candidate) => candidate.codigo === codigo);
    return link ? { ...link } : null;
  }

  async create(link) {
    return this.enqueue(async () => {
      const links = await this.read();
      if (links.some((candidate) => candidate.codigo === link.codigo)) {
        const error = new Error('El código ya existe');
        error.code = 'DUPLICATE_CODE';
        throw error;
      }

      links.push({ ...link });
      await this.write(links);
      return { ...link };
    });
  }

  async incrementClicks(codigo) {
    return this.enqueue(async () => {
      const links = await this.read();
      const link = links.find((candidate) => candidate.codigo === codigo);
      if (!link) return null;

      link.clicks += 1;
      await this.write(links);
      return { ...link };
    });
  }
}

module.exports = { JsonLinkStore };
