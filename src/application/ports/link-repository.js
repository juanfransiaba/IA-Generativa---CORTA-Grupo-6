const REQUIRED_METHODS = Object.freeze([
  'save',
  'findByShortCode',
  'incrementClickCount'
]);

function assertLinkRepository(linkRepository) {
  if (!linkRepository) throw new TypeError('Se requiere un linkRepository');

  for (const methodName of REQUIRED_METHODS) {
    if (typeof linkRepository[methodName] !== 'function') {
      throw new TypeError(`linkRepository debe implementar ${methodName}()`);
    }
  }

  return linkRepository;
}

module.exports = { assertLinkRepository };
