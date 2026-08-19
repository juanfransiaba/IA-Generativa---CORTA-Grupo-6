const { JsonLinkRepository } = require('./json-link-repository');
const { PostgresLinkRepository } = require('./postgres-link-repository');

function createLinkRepository({ databaseUrl, dataFile, pool } = {}) {
  if (databaseUrl) {
    return new PostgresLinkRepository({
      connectionString: databaseUrl,
      pool
    });
  }

  if (!dataFile) {
    throw new TypeError('Se requiere dataFile cuando no hay DATABASE_URL');
  }
  return new JsonLinkRepository(dataFile);
}

module.exports = { createLinkRepository };
