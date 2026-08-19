const assert = require('node:assert/strict');
const test = require('node:test');
const { startTestServer } = require('./helpers');

test('la portada muestra errores de creación en vez de construir un link inválido', async (t) => {
  const context = await startTestServer();
  t.after(context.close);

  const response = await fetch(`${context.baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="crear-error"/);
  assert.match(html, /if \(!res\.ok\) throw new Error\(data\.error/);
  assert.match(html, /catch \(error\)/);
});
