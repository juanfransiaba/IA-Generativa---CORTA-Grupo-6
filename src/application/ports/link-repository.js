const LINK_REPOSITORY_METHODS = Object.freeze([
  'save',
  'findByShortCode',
  'incrementClickCount'
]);

/*
 * Puerto de persistencia consumido por los casos de uso.
 *
 * save(shortLink)            -> Result<ShortLink, SHORT_CODE_COLLISION>
 * findByShortCode(shortCode) -> Result<ShortLink, SHORT_LINK_NOT_FOUND>
 * incrementClickCount(code)  -> Result<ShortLink, SHORT_LINK_NOT_FOUND>
 */

module.exports = { LINK_REPOSITORY_METHODS };
