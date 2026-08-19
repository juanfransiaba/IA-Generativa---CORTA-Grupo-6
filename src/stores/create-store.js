const { JsonLinkStore } = require('./json-link-store');
const { PostgresLinkStore } = require('./postgres-link-store');

function createStore(options = {}) {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (databaseUrl) {
    return new PostgresLinkStore({
      connectionString: databaseUrl,
      pool: options.pool
    });
  }

  if (!options.dataFile) {
    throw new TypeError('createStore requiere dataFile cuando no hay DATABASE_URL');
  }
  return new JsonLinkStore(options.dataFile);
}

module.exports = { createStore };
