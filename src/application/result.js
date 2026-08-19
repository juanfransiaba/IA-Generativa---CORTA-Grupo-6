const FailureReason = Object.freeze({
  INVALID_ORIGINAL_URL: 'INVALID_ORIGINAL_URL',
  SHORT_CODE_COLLISION: 'SHORT_CODE_COLLISION',
  SHORT_CODE_GENERATION_EXHAUSTED: 'SHORT_CODE_GENERATION_EXHAUSTED',
  SHORT_LINK_NOT_FOUND: 'SHORT_LINK_NOT_FOUND'
});

function success(value) {
  return Object.freeze({ ok: true, value });
}

function failure(reason) {
  return Object.freeze({ ok: false, reason });
}

module.exports = { FailureReason, failure, success };
