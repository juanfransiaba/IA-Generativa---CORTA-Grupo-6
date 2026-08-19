class ResolveShortLinkService {
  constructor({ linkRepository }) {
    this.linkRepository = linkRepository;
  }

  async execute(shortCode) {
    return this.linkRepository.incrementClickCount(shortCode);
  }
}

module.exports = { ResolveShortLinkService };
