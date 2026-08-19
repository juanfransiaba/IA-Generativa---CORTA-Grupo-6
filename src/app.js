const path = require('node:path');
const express = require('express');
const { LinkController } = require('./link-controller');
const { LinkService } = require('./link-service');

const REQUIRED_REPOSITORY_METHODS = Object.freeze([
  'save',
  'findByShortCode',
  'incrementClickCount'
]);

function assertDependencies({ linkRepository, generateCode, clock, logger }) {
  if (!linkRepository) throw new TypeError('Se requiere un linkRepository');
  for (const methodName of REQUIRED_REPOSITORY_METHODS) {
    if (typeof linkRepository[methodName] !== 'function') {
      throw new TypeError(`linkRepository debe implementar ${methodName}()`);
    }
  }
  if (typeof generateCode !== 'function') throw new TypeError('Se requiere generateCode');
  if (typeof clock !== 'function') throw new TypeError('Se requiere clock');
  if (!logger || typeof logger.error !== 'function') {
    throw new TypeError('Se requiere logger');
  }
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function createApp({
  linkRepository,
  generateCode,
  clock,
  logger,
  maxCodeAttempts = 100,
  publicDirectory = path.join(__dirname, '..', 'public')
}) {
  assertDependencies({ linkRepository, generateCode, clock, logger });
  const linkService = new LinkService({
    repository: linkRepository,
    generateCode,
    clock,
    maxCodeAttempts
  });
  const controller = new LinkController({ linkService });
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.get('/health', (request, response) => response.json({ status: 'ok' }));
  app.post('/api/links', asyncRoute(controller.create.bind(controller)));
  app.get(
    '/api/links/:codigo/stats',
    asyncRoute(controller.getStatistics.bind(controller))
  );
  app.use(express.static(publicDirectory));
  app.get('/:codigo', asyncRoute(controller.redirect.bind(controller)));

  app.use((error, request, response, next) => {
    const isMalformedJson = error instanceof SyntaxError
      && error.status === 400
      && 'body' in error;
    if (isMalformedJson) {
      return response.status(400).json({ error: 'El cuerpo debe ser JSON válido' });
    }
    if (response.headersSent) return next(error);
    logger.error('Error no controlado en Corta', { errorType: error.name });
    return response.status(500).json({ error: 'Error interno' });
  });

  return app;
}

module.exports = { createApp };
