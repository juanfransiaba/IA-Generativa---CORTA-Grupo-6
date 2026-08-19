function normalizeOriginalUrl(candidate) {
  if (typeof candidate !== 'string') return null;

  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) return null;

  try {
    const parsedUrl = new URL(trimmedCandidate);
    const usesAllowedProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    return usesAllowedProtocol ? trimmedCandidate : null;
  } catch {
    return null;
  }
}

module.exports = { normalizeOriginalUrl };
