const {
  LINK_REPOSITORY_METHODS
} = require('../application/ports/link-repository');

function assertApplicationDependencies({
  linkRepository,
  shortCodeGenerator,
  clock,
  logger
}) {
  if (!linkRepository) throw new TypeError('Se requiere un linkRepository');
  for (const methodName of LINK_REPOSITORY_METHODS) {
    if (typeof linkRepository[methodName] !== 'function') {
      throw new TypeError(`linkRepository debe implementar ${methodName}()`);
    }
  }

  if (typeof shortCodeGenerator !== 'function') {
    throw new TypeError('Se requiere un shortCodeGenerator');
  }
  if (typeof clock !== 'function') throw new TypeError('Se requiere un clock');
  if (!logger || typeof logger.error !== 'function') {
    throw new TypeError('Se requiere un logger');
  }
}

module.exports = { assertApplicationDependencies };
