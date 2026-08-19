function isMalformedJsonError(error) {
  return error instanceof SyntaxError && error.status === 400 && 'body' in error;
}

function createErrorHandler({ logger }) {
  return (error, request, response, next) => {
    if (isMalformedJsonError(error)) {
      return response.status(400).json({ error: 'El cuerpo debe ser JSON válido' });
    }

    if (response.headersSent) return next(error);
    logger.error('Error no controlado en Corta', { errorType: error.name });
    return response.status(500).json({ error: 'Error interno' });
  };
}

module.exports = { createErrorHandler, isMalformedJsonError };
