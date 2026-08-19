const { Pool } = require('pg');

function normalizeRow(row) {
  if (!row) return null;
  const creado = row.creado instanceof Date
    ? row.creado.toISOString()
    : new Date(row.creado).toISOString();

  return {
    codigo: row.codigo,
    url: row.url,
    clicks: Number(row.clicks),
    creado
  };
}

class PostgresLinkStore {
  constructor(options = {}) {
    this.ownsPool = !options.pool;
    this.pool = options.pool || new Pool({ connectionString: options.connectionString });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        codigo TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
        creado TIMESTAMPTZ NOT NULL
      )
    `);
  }

  async create(link) {
    try {
      const result = await this.pool.query(
        `INSERT INTO links (codigo, url, clicks, creado)
         VALUES ($1, $2, $3, $4)
         RETURNING codigo, url, clicks, creado`,
        [link.codigo, link.url, link.clicks, link.creado]
      );
      return normalizeRow(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        const duplicateError = new Error('El código ya existe');
        duplicateError.code = 'DUPLICATE_CODE';
        throw duplicateError;
      }
      throw error;
    }
  }

  async findByCode(codigo) {
    const result = await this.pool.query(
      'SELECT codigo, url, clicks, creado FROM links WHERE codigo = $1',
      [codigo]
    );
    return normalizeRow(result.rows[0]);
  }

  async incrementClicks(codigo) {
    const result = await this.pool.query(
      `UPDATE links
       SET clicks = clicks + 1
       WHERE codigo = $1
       RETURNING codigo, url, clicks, creado`,
      [codigo]
    );
    return normalizeRow(result.rows[0]);
  }

  async close() {
    if (this.ownsPool) await this.pool.end();
  }
}

module.exports = { PostgresLinkStore, normalizeRow };
