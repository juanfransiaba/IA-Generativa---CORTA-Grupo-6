function normalizeOriginalUrl(candidate) {
  if (typeof candidate !== 'string') return null;

  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) return null;

  try {
    const parsedUrl = new URL(trimmedCandidate);
    const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    return isHttp ? trimmedCandidate : null;
  } catch {
    return null;
  }
}

function toImmutableShortLink({ shortCode, originalUrl, clickCount, createdAt }) {
  return Object.freeze({
    shortCode,
    originalUrl,
    clickCount: Number(clickCount),
    createdAt
  });
}

function createShortLink({ shortCode, originalUrl, createdAt }) {
  return toImmutableShortLink({ shortCode, originalUrl, clickCount: 0, createdAt });
}

module.exports = { createShortLink, normalizeOriginalUrl, toImmutableShortLink };
