const { FailureReason } = require('../../../application/result');

class RedirectShortLinkController {
  constructor({ resolveShortLinkService }) {
    this.resolveShortLinkService = resolveShortLinkService;
  }

  async handle(request, response) {
    const result = await this.resolveShortLinkService.execute(request.params.codigo);
    if (result.ok) return response.redirect(302, result.value.originalUrl);
    if (result.reason === FailureReason.SHORT_LINK_NOT_FOUND) {
      return response.status(404).send('No existe ese link');
    }
    throw new Error('Resultado inesperado al resolver un link corto');
  }
}

module.exports = { RedirectShortLinkController };
