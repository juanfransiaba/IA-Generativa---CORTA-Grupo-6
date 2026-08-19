function presentCreatedShortLink(shortLink) {
  return Object.freeze({
    codigo: shortLink.shortCode,
    corta: `/${shortLink.shortCode}`
  });
}

function presentShortLinkStatistics(shortLink) {
  return Object.freeze({
    codigo: shortLink.shortCode,
    url: shortLink.originalUrl,
    clicks: shortLink.clickCount,
    creado: shortLink.createdAt
  });
}

module.exports = { presentCreatedShortLink, presentShortLinkStatistics };
