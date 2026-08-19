const { FailureReason } = require('./link-service');

const CREATE_FAILURES = Object.freeze({
  [FailureReason.INVALID_ORIGINAL_URL]: Object.freeze({
    status: 400,
    message: 'La url debe ser HTTP(S) y absoluta'
  }),
  [FailureReason.SHORT_CODE_GENERATION_EXHAUSTED]: Object.freeze({
    status: 503,
    message: 'No se pudo generar un código único; intentá nuevamente'
  })
});

class LinkController {
  constructor({ linkService }) {
    this.linkService = linkService;
  }

  async create(request, response) {
    const result = await this.linkService.create(request.body?.url);
    if (result.ok) {
      return response.status(201).json({
        codigo: result.value.shortCode,
        corta: `/${result.value.shortCode}`
      });
    }

    const failureResponse = CREATE_FAILURES[result.reason];
    if (!failureResponse) throw new Error('Resultado inesperado al crear un link corto');
    return response.status(failureResponse.status).json({ error: failureResponse.message });
  }

  async getStatistics(request, response) {
    const result = await this.linkService.getStatistics(request.params.codigo);
    if (!result.ok) return response.status(404).json({ error: 'Link no encontrado' });

    return response.json({
      codigo: result.value.shortCode,
      url: result.value.originalUrl,
      clicks: result.value.clickCount,
      creado: result.value.createdAt
    });
  }

  async redirect(request, response) {
    const result = await this.linkService.resolve(request.params.codigo);
    if (!result.ok) return response.status(404).send('No existe ese link');
    return response.redirect(302, result.value.originalUrl);
  }
}

module.exports = { LinkController };
