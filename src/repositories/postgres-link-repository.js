const { Pool } = require('pg');
const { toImmutableShortLink } = require('../short-link');

function normalizeRow(row) {
  if (!row) return null;
  const createdAt = row.creado instanceof Date
    ? row.creado.toISOString()
    : new Date(row.creado).toISOString();
  return toImmutableShortLink({
    shortCode: row.codigo,
    originalUrl: row.url,
    clickCount: row.clicks,
    createdAt
  });
}

class PostgresLinkRepository {
  constructor({ connectionString, pool } = {}) {
    this.ownsPool = !pool;
    this.pool = pool || new Pool({ connectionString });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        codigo TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
        creado TIMESTAMPTZ NOT NULL
      )
    `);
  }

  async save(shortLink) {
    try {
      await this.pool.query(
        `INSERT INTO links (codigo, url, clicks, creado)
         VALUES ($1, $2, $3, $4)`,
        [
          shortLink.shortCode,
          shortLink.originalUrl,
          shortLink.clickCount,
          shortLink.createdAt
        ]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') return false;
      throw error;
    }
  }

  async findByShortCode(shortCode) {
    const result = await this.pool.query(
      'SELECT codigo, url, clicks, creado FROM links WHERE codigo = $1',
      [shortCode]
    );
    return normalizeRow(result.rows[0]);
  }

  async incrementClickCount(shortCode) {
    const result = await this.pool.query(
      `UPDATE links
       SET clicks = clicks + 1
       WHERE codigo = $1
       RETURNING codigo, url, clicks, creado`,
      [shortCode]
    );
    return normalizeRow(result.rows[0]);
  }

  async close() {
    if (this.ownsPool) await this.pool.end();
  }
}

module.exports = { PostgresLinkRepository };
