class RedirectShortLinkController {
  constructor({ resolveShortLinkService }) {
    this.resolveShortLinkService = resolveShortLinkService;
  }

  async handle(request, response) {
    const shortLink = await this.resolveShortLinkService.execute(request.params.codigo);
    return response.redirect(302, shortLink.originalUrl);
  }
}

module.exports = { RedirectShortLinkController };
