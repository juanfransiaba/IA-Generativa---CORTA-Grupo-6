const {
  InvalidOriginalUrlError,
  ShortCodeCollisionError,
  ShortCodeGenerationExhaustedError
} = require('../../domain/errors');
const { normalizeOriginalUrl } = require('../../domain/normalize-original-url');
const { createNewShortLink } = require('../../domain/short-link');

class CreateShortLinkService {
  constructor({
    linkRepository,
    shortCodeGenerator,
    clock = () => new Date(),
    maxCodeAttempts = 100
  }) {
    if (!linkRepository) throw new TypeError('Se requiere un linkRepository');
    if (typeof shortCodeGenerator !== 'function') {
      throw new TypeError('Se requiere un shortCodeGenerator');
    }

    this.linkRepository = linkRepository;
    this.shortCodeGenerator = shortCodeGenerator;
    this.clock = clock;
    this.maxCodeAttempts = maxCodeAttempts;
  }

  async execute(originalUrlCandidate) {
    const originalUrl = normalizeOriginalUrl(originalUrlCandidate);
    if (!originalUrl) throw new InvalidOriginalUrlError();

    for (let attempt = 0; attempt < this.maxCodeAttempts; attempt += 1) {
      const shortLink = createNewShortLink({
        shortCode: this.shortCodeGenerator(),
        originalUrl,
        createdAt: this.clock()
      });

      try {
        await this.linkRepository.save(shortLink);
        return shortLink;
      } catch (error) {
        if (!(error instanceof ShortCodeCollisionError)) throw error;
      }
    }

    throw new ShortCodeGenerationExhaustedError();
  }
}

module.exports = { CreateShortLinkService };
