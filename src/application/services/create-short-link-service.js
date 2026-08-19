const { FailureReason, failure, success } = require('../result');
const { normalizeOriginalUrl } = require('../../domain/normalize-original-url');
const { createNewShortLink } = require('../../domain/short-link');

class CreateShortLinkService {
  constructor({
    linkRepository,
    shortCodeGenerator,
    clock,
    maxCodeAttempts = 100
  }) {
    this.linkRepository = linkRepository;
    this.shortCodeGenerator = shortCodeGenerator;
    this.clock = clock;
    this.maxCodeAttempts = maxCodeAttempts;
  }

  async execute(originalUrlCandidate) {
    const originalUrl = normalizeOriginalUrl(originalUrlCandidate);
    if (!originalUrl) return failure(FailureReason.INVALID_ORIGINAL_URL);

    for (let attempt = 0; attempt < this.maxCodeAttempts; attempt += 1) {
      const shortLink = createNewShortLink({
        shortCode: this.shortCodeGenerator(),
        originalUrl,
        createdAt: this.clock()
      });

      const persistenceResult = await this.linkRepository.save(shortLink);
      if (persistenceResult.ok) return success(persistenceResult.value);
      if (persistenceResult.reason !== FailureReason.SHORT_CODE_COLLISION) {
        return persistenceResult;
      }
    }

    return failure(FailureReason.SHORT_CODE_GENERATION_EXHAUSTED);
  }
}

module.exports = { CreateShortLinkService };
