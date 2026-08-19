const { presentCreatedShortLink } = require('../presenters/short-link-presenter');
const { FailureReason } = require('../../../application/result');

const FAILURE_RESPONSES = Object.freeze({
  [FailureReason.INVALID_ORIGINAL_URL]: Object.freeze({
    status: 400,
    message: 'La url debe ser HTTP(S) y absoluta'
  }),
  [FailureReason.SHORT_CODE_GENERATION_EXHAUSTED]: Object.freeze({
    status: 503,
    message: 'No se pudo generar un código único; intentá nuevamente'
  })
});

class CreateShortLinkController {
  constructor({ createShortLinkService }) {
    this.createShortLinkService = createShortLinkService;
  }

  async handle(request, response) {
    const result = await this.createShortLinkService.execute(request.body?.url);
    if (result.ok) {
      return response.status(201).json(presentCreatedShortLink(result.value));
    }

    const failureResponse = FAILURE_RESPONSES[result.reason];
    if (!failureResponse) throw new Error('Resultado inesperado al crear un link corto');
    return response.status(failureResponse.status).json({ error: failureResponse.message });
  }
}

module.exports = { CreateShortLinkController };
