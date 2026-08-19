const { createShortLink, normalizeOriginalUrl } = require('./short-link');

const FailureReason = Object.freeze({
  INVALID_ORIGINAL_URL: 'INVALID_ORIGINAL_URL',
  SHORT_CODE_GENERATION_EXHAUSTED: 'SHORT_CODE_GENERATION_EXHAUSTED',
  SHORT_LINK_NOT_FOUND: 'SHORT_LINK_NOT_FOUND'
});

const success = (value) => Object.freeze({ ok: true, value });
const failure = (reason) => Object.freeze({ ok: false, reason });

class LinkService {
  constructor({ repository, generateCode, clock, maxCodeAttempts = 100 }) {
    this.repository = repository;
    this.generateCode = generateCode;
    this.clock = clock;
    this.maxCodeAttempts = maxCodeAttempts;
  }

  async create(originalUrlCandidate) {
    const originalUrl = normalizeOriginalUrl(originalUrlCandidate);
    if (!originalUrl) return failure(FailureReason.INVALID_ORIGINAL_URL);

    for (let attempt = 0; attempt < this.maxCodeAttempts; attempt += 1) {
      const shortLink = createShortLink({
        shortCode: this.generateCode(),
        originalUrl,
        createdAt: this.clock()
      });
      if (await this.repository.save(shortLink)) return success(shortLink);
    }

    return failure(FailureReason.SHORT_CODE_GENERATION_EXHAUSTED);
  }

  async getStatistics(shortCode) {
    const shortLink = await this.repository.findByShortCode(shortCode);
    return shortLink ? success(shortLink) : failure(FailureReason.SHORT_LINK_NOT_FOUND);
  }

  async resolve(shortCode) {
    const shortLink = await this.repository.incrementClickCount(shortCode);
    return shortLink ? success(shortLink) : failure(FailureReason.SHORT_LINK_NOT_FOUND);
  }
}

module.exports = { FailureReason, LinkService };
