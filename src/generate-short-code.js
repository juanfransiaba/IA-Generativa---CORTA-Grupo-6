const CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateShortCode(length = 6) {
  return Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    return CHARACTERS[randomIndex];
  }).join('');
}

module.exports = { generateShortCode };
