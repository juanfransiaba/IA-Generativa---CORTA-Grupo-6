const { presentShortLinkStatistics } = require('../presenters/short-link-presenter');
const { FailureReason } = require('../../../application/result');

class GetShortLinkStatisticsController {
  constructor({ getShortLinkStatisticsService }) {
    this.getShortLinkStatisticsService = getShortLinkStatisticsService;
  }

  async handle(request, response) {
    const result = await this.getShortLinkStatisticsService.execute(
      request.params.codigo
    );
    if (result.ok) return response.json(presentShortLinkStatistics(result.value));
    if (result.reason === FailureReason.SHORT_LINK_NOT_FOUND) {
      return response.status(404).json({ error: 'Link no encontrado' });
    }
    throw new Error('Resultado inesperado al consultar estadísticas');
  }
}

module.exports = { GetShortLinkStatisticsController };
