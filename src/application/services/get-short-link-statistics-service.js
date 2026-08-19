const { ShortLinkNotFoundError } = require('../../domain/errors');

class GetShortLinkStatisticsService {
  constructor({ linkRepository }) {
    if (!linkRepository) throw new TypeError('Se requiere un linkRepository');
    this.linkRepository = linkRepository;
  }

  async execute(shortCode) {
    const shortLink = await this.linkRepository.findByShortCode(shortCode);
    if (!shortLink) throw new ShortLinkNotFoundError(shortCode);
    return shortLink;
  }
}

module.exports = { GetShortLinkStatisticsService };
