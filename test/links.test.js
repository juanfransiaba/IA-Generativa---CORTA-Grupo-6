const assert = require('node:assert/strict');
const test = require('node:test');
const { MemoryLinkRepository, postJson, startTestServer } = require('./helpers');

test('POST /api/links crea un link válido con fecha y cero clicks', async (t) => {
  const context = await startTestServer({ codes: ['abc123'] });
  t.after(context.close);

  const response = await postJson(context.baseUrl, '/api/links', {
    url: '  https://example.com/una-ruta?x=1  '
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { codigo: 'abc123', corta: '/abc123' });
  assert.deepEqual(await context.linkRepository.findByShortCode('abc123'), {
    shortCode: 'abc123',
    originalUrl: 'https://example.com/una-ruta?x=1',
    clickCount: 0,
    createdAt: '2026-08-18T15:30:00.000Z'
  });
});

for (const [name, body] of [
  ['campo ausente', {}],
  ['cadena vacía', { url: '' }],
  ['solo espacios', { url: '   ' }],
  ['URL relativa', { url: '/interna' }],
  ['URL sin protocolo', { url: 'example.com' }],
  ['protocolo no permitido', { url: 'ftp://example.com/archivo' }],
  ['valor no textual', { url: 42 }]
]) {
  test(`POST /api/links rechaza ${name}`, async (t) => {
    const context = await startTestServer();
    t.after(context.close);

    const response = await postJson(context.baseUrl, '/api/links', body);

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /url/i);
  });
}

test('POST /api/links rechaza JSON malformado', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
    redirect: 'manual'
  });

  assert.equal(response.status, 400);
});

test('una colisión genera otro código y no pisa el link existente', async (t) => {
  const original = {
    shortCode: 'abc123',
    originalUrl: 'https://original.example',
    clickCount: 7,
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  const context = await startTestServer({
    initialLinks: [original],
    codes: ['abc123', 'def456']
  });
  t.after(context.close);

  const response = await postJson(context.baseUrl, '/api/links', {
    url: 'https://nuevo.example'
  });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).codigo, 'def456');
  assert.deepEqual(
    await context.linkRepository.findByShortCode('abc123'),
    original
  );
  assert.equal(
    (await context.linkRepository.findByShortCode('def456')).originalUrl,
    'https://nuevo.example'
  );
});

test('el agotamiento de colisiones responde 503 sin datos parciales', async (t) => {
  const original = {
    shortCode: 'ocupado',
    originalUrl: 'https://original.example',
    clickCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  const linkRepository = new MemoryLinkRepository([original]);
  const context = await startTestServer({
    linkRepository,
    shortCodeGenerator: () => 'ocupado',
    maxCodeAttempts: 3
  });
  t.after(context.close);

  const response = await postJson(context.baseUrl, '/api/links', {
    url: 'https://nuevo.example'
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await linkRepository.findByShortCode('ocupado'), original);
});

test('GET /:codigo incrementa el click y redirige al destino', async (t) => {
  const context = await startTestServer({
    initialLinks: [{
      codigo: 'abc123',
      url: 'https://example.com/destino',
      clicks: 0,
      creado: '2026-01-01T00:00:00.000Z'
    }]
  });
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/abc123`, { redirect: 'manual' });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.com/destino');
  assert.equal(
    (await context.linkRepository.findByShortCode('abc123')).clickCount,
    1
  );
});

test('cada redirección exitosa cuenta exactamente una vez', async (t) => {
  const context = await startTestServer({
    initialLinks: [{
      codigo: 'abc123',
      url: 'https://example.com',
      clicks: 4,
      creado: '2026-01-01T00:00:00.000Z'
    }]
  });
  t.after(context.close);

  await fetch(`${context.baseUrl}/abc123`, { redirect: 'manual' });
  await fetch(`${context.baseUrl}/abc123`, { redirect: 'manual' });

  assert.equal(
    (await context.linkRepository.findByShortCode('abc123')).clickCount,
    6
  );
});

test('un código inexistente responde 404 sin alterar otros links', async (t) => {
  const original = {
    codigo: 'abc123',
    url: 'https://example.com',
    clicks: 9,
    creado: '2026-01-01T00:00:00.000Z'
  };
  const context = await startTestServer({ initialLinks: [original] });
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/noexiste`, { redirect: 'manual' });

  assert.equal(response.status, 404);
  assert.deepEqual(await context.linkRepository.findByShortCode('abc123'), {
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    clickCount: 9,
    createdAt: '2026-01-01T00:00:00.000Z'
  });
});
