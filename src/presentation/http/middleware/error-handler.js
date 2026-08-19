const {
  InvalidOriginalUrlError,
  ShortCodeGenerationExhaustedError,
  ShortLinkNotFoundError
} = require('../../../domain/errors');

function isMalformedJsonError(error) {
  return error instanceof SyntaxError && error.status === 400 && 'body' in error;
}

function createErrorHandler({ logger = console } = {}) {
  return (error, request, response, next) => {
    if (isMalformedJsonError(error)) {
      return response.status(400).json({ error: 'El cuerpo debe ser JSON válido' });
    }

    if (error instanceof InvalidOriginalUrlError) {
      return response.status(400).json({ error: error.message });
    }

    if (error instanceof ShortCodeGenerationExhaustedError) {
      return response.status(503).json({ error: error.message });
    }

    if (error instanceof ShortLinkNotFoundError) {
      if (request.path.startsWith('/api/')) {
        return response.status(404).json({ error: 'Link no encontrado' });
      }
      return response.status(404).send('No existe ese link');
    }

    if (response.headersSent) return next(error);
    logger.error('Error no controlado en Corta', { errorType: error.name });
    return response.status(500).json({ error: 'Error interno' });
  };
}

module.exports = { createErrorHandler, isMalformedJsonError };
