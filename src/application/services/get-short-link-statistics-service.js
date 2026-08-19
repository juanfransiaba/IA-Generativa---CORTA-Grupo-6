class GetShortLinkStatisticsService {
  constructor({ linkRepository }) {
    this.linkRepository = linkRepository;
  }

  async execute(shortCode) {
    return this.linkRepository.findByShortCode(shortCode);
  }
}

module.exports = { GetShortLinkStatisticsService };
