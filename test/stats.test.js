const assert = require('node:assert/strict');
const test = require('node:test');
const { startTestServer } = require('./helpers');

const link = {
  codigo: 'abc123',
  url: 'https://example.com/destino',
  clicks: 7,
  creado: '2026-04-03T16:40:10.000Z'
};

test('GET /api/links/:codigo/stats devuelve los datos reales', async (t) => {
  const context = await startTestServer({ initialLinks: [link] });
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/api/links/abc123/stats`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), link);
});

test('consultar estadísticas no incrementa clicks', async (t) => {
  const context = await startTestServer({ initialLinks: [link] });
  t.after(context.close);

  const firstResponse = await fetch(`${context.baseUrl}/api/links/abc123/stats`);
  const secondResponse = await fetch(`${context.baseUrl}/api/links/abc123/stats`);

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal((await context.store.findByCode('abc123')).clicks, 7);
});

test('las estadísticas reflejan las redirecciones confirmadas', async (t) => {
  const context = await startTestServer({ initialLinks: [link] });
  t.after(context.close);

  await fetch(`${context.baseUrl}/abc123`, { redirect: 'manual' });
  await fetch(`${context.baseUrl}/abc123`, { redirect: 'manual' });
  const response = await fetch(`${context.baseUrl}/api/links/abc123/stats`);

  assert.equal((await response.json()).clicks, 9);
});

test('estadísticas de un código inexistente responde 404 JSON', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/api/links/noexiste/stats`);

  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /no encontrado/i);
});

test('stats.html consulta la API y no contiene estadísticas inventadas', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/stats.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(html, />123</);
  assert.match(html, /fetch\(`\/api\/links\/\$\{encodeURIComponent\(codigo\)\}\/stats`\)/);
  assert.match(html, /id="stats-clicks"/);
  assert.match(html, /id="stats-url"/);
  assert.match(html, /id="stats-creado"/);
  assert.match(html, /id="stats-error"/);
});
