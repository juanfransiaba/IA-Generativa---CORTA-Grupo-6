const path = require('node:path');
const express = require('express');
const { generateCode: defaultGenerateCode } = require('./code');

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function parseHttpUrl(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  } catch {
    return null;
  }
}

function createApp(options = {}) {
  const {
    store,
    generateCode = defaultGenerateCode,
    now = () => new Date(),
    maxCodeAttempts = 100,
    publicDir = path.join(__dirname, '..', 'public')
  } = options;

  if (!store) throw new TypeError('createApp requiere un store');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/health', (request, response) => {
    response.json({ status: 'ok' });
  });

  app.post('/api/links', asyncRoute(async (request, response) => {
    const url = parseHttpUrl(request.body?.url);
    if (!url) {
      return response.status(400).json({ error: 'La url debe ser HTTP(S) y absoluta' });
    }

    for (let attempt = 0; attempt < maxCodeAttempts; attempt += 1) {
      const codigo = generateCode();
      const link = {
        codigo,
        url,
        clicks: 0,
        creado: now().toISOString()
      };

      try {
        await store.create(link);
        return response.status(201).json({ codigo, corta: `/${codigo}` });
      } catch (error) {
        if (error.code !== 'DUPLICATE_CODE') throw error;
      }
    }

    return response.status(503).json({
      error: 'No se pudo generar un código único; intentá nuevamente'
    });
  }));

  app.get('/api/links/:codigo/stats', asyncRoute(async (request, response) => {
    const link = await store.findByCode(request.params.codigo);
    if (!link) {
      return response.status(404).json({ error: 'Link no encontrado' });
    }

    return response.json({
      codigo: link.codigo,
      url: link.url,
      clicks: link.clicks,
      creado: link.creado
    });
  }));

  app.use(express.static(publicDir));

  app.get('/:codigo', asyncRoute(async (request, response) => {
    const link = await store.incrementClicks(request.params.codigo);
    if (!link) return response.status(404).send('No existe ese link');
    return response.redirect(302, link.url);
  }));

  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: 'El cuerpo debe ser JSON válido' });
    }

    if (response.headersSent) return next(error);
    console.error('Error no controlado:', error.message);
    return response.status(500).json({ error: 'Error interno' });
  });

  return app;
}

module.exports = { createApp, parseHttpUrl };
