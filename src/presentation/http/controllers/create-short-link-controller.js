const { presentCreatedShortLink } = require('../presenters/short-link-presenter');

class CreateShortLinkController {
  constructor({ createShortLinkService }) {
    this.createShortLinkService = createShortLinkService;
  }

  async handle(request, response) {
    const shortLink = await this.createShortLinkService.execute(request.body?.url);
    return response.status(201).json(presentCreatedShortLink(shortLink));
  }
}

module.exports = { CreateShortLinkController };
