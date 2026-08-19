const ALPHANUMERIC_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const DEFAULT_SHORT_CODE_LENGTH = 6;

function generateRandomShortCode(length = DEFAULT_SHORT_CODE_LENGTH) {
  return Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * ALPHANUMERIC_CHARACTERS.length);
    return ALPHANUMERIC_CHARACTERS[randomIndex];
  }).join('');
}

module.exports = { generateRandomShortCode };
