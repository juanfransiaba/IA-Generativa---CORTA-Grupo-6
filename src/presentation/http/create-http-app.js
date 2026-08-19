const express = require('express');
const { asyncRoute } = require('./middleware/async-route');
const { createErrorHandler } = require('./middleware/error-handler');

function createHttpApp({ controllers, publicDirectory, logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/health', controllers.health.handle.bind(controllers.health));
  app.post(
    '/api/links',
    asyncRoute(controllers.createShortLink.handle.bind(controllers.createShortLink))
  );
  app.get(
    '/api/links/:codigo/stats',
    asyncRoute(
      controllers.getShortLinkStatistics.handle.bind(controllers.getShortLinkStatistics)
    )
  );

  app.use(express.static(publicDirectory));
  app.get(
    '/:codigo',
    asyncRoute(controllers.redirectShortLink.handle.bind(controllers.redirectShortLink))
  );
  app.use(createErrorHandler({ logger }));

  return app;
}

module.exports = { createHttpApp };
