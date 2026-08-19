const CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateCode(length = 6) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return code;
}

module.exports = { generateCode };
