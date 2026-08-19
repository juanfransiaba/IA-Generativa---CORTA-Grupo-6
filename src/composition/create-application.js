const path = require('node:path');
const { assertLinkRepository } = require('../application/ports/link-repository');
const {
  CreateShortLinkService
} = require('../application/services/create-short-link-service');
const {
  GetShortLinkStatisticsService
} = require('../application/services/get-short-link-statistics-service');
const {
  ResolveShortLinkService
} = require('../application/services/resolve-short-link-service');
const {
  generateRandomShortCode
} = require('../infrastructure/random/generate-random-short-code');
const {
  CreateShortLinkController
} = require('../presentation/http/controllers/create-short-link-controller');
const {
  GetShortLinkStatisticsController
} = require('../presentation/http/controllers/get-short-link-statistics-controller');
const {
  RedirectShortLinkController
} = require('../presentation/http/controllers/redirect-short-link-controller');
const { HealthController } = require('../presentation/http/controllers/health-controller');
const { createHttpApp } = require('../presentation/http/create-http-app');

function createApplication({
  linkRepository,
  shortCodeGenerator = generateRandomShortCode,
  clock = () => new Date(),
  maxCodeAttempts = 100,
  publicDirectory = path.join(__dirname, '..', '..', 'public'),
  logger = console
}) {
  assertLinkRepository(linkRepository);

  const createShortLinkService = new CreateShortLinkService({
    linkRepository,
    shortCodeGenerator,
    clock,
    maxCodeAttempts
  });
  const getShortLinkStatisticsService = new GetShortLinkStatisticsService({
    linkRepository
  });
  const resolveShortLinkService = new ResolveShortLinkService({ linkRepository });

  const controllers = Object.freeze({
    createShortLink: new CreateShortLinkController({ createShortLinkService }),
    getShortLinkStatistics: new GetShortLinkStatisticsController({
      getShortLinkStatisticsService
    }),
    redirectShortLink: new RedirectShortLinkController({ resolveShortLinkService }),
    health: new HealthController()
  });

  return createHttpApp({ controllers, publicDirectory, logger });
}

module.exports = { createApplication };
