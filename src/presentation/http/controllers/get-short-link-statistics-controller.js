const { presentShortLinkStatistics } = require('../presenters/short-link-presenter');

class GetShortLinkStatisticsController {
  constructor({ getShortLinkStatisticsService }) {
    this.getShortLinkStatisticsService = getShortLinkStatisticsService;
  }

  async handle(request, response) {
    const shortLink = await this.getShortLinkStatisticsService.execute(
      request.params.codigo
    );
    return response.json(presentShortLinkStatistics(shortLink));
  }
}

module.exports = { GetShortLinkStatisticsController };
