function toImmutableShortLink({ shortCode, originalUrl, clickCount, createdAt }) {
  return Object.freeze({
    shortCode,
    originalUrl,
    clickCount: Number(clickCount),
    createdAt: new Date(createdAt).toISOString()
  });
}

function createNewShortLink({ shortCode, originalUrl, createdAt }) {
  return toImmutableShortLink({
    shortCode,
    originalUrl,
    clickCount: 0,
    createdAt
  });
}

module.exports = { createNewShortLink, toImmutableShortLink };
