class HealthController {
  handle(request, response) {
    return response.json({ status: 'ok' });
  }
}

module.exports = { HealthController };
