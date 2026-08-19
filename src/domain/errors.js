class InvalidOriginalUrlError extends Error {
  constructor() {
    super('La url debe ser HTTP(S) y absoluta');
    this.name = 'InvalidOriginalUrlError';
  }
}

class ShortCodeCollisionError extends Error {
  constructor() {
    super('El código corto ya existe');
    this.name = 'ShortCodeCollisionError';
  }
}

class ShortCodeGenerationExhaustedError extends Error {
  constructor() {
    super('No se pudo generar un código único; intentá nuevamente');
    this.name = 'ShortCodeGenerationExhaustedError';
  }
}

class ShortLinkNotFoundError extends Error {
  constructor(shortCode) {
    super(`No existe el link corto ${shortCode}`);
    this.name = 'ShortLinkNotFoundError';
    this.shortCode = shortCode;
  }
}

module.exports = {
  InvalidOriginalUrlError,
  ShortCodeCollisionError,
  ShortCodeGenerationExhaustedError,
  ShortLinkNotFoundError
};
