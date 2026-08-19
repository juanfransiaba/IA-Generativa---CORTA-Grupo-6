# Corta

Corta es un acortador de URLs interno. El primer commit conserva el estado heredado y documenta su evolución desde una carpeta desordenada hasta una aplicación probada y desplegable.

## Producción

- Aplicación: https://ia-generativa-corta-grupo-6-production.up.railway.app
- Infraestructura: servicio Node.js y PostgreSQL administrados por Railway.
- Persistencia verificada: los links y sus clicks sobreviven a un redeploy.

## Requisitos

- Node.js 20 o superior
- npm
- PostgreSQL para producción (en desarrollo puede usarse almacenamiento local)

## Desarrollo local

```bash
npm install
npm test
npm start
```

La aplicación queda disponible en `http://localhost:3000` por defecto. Se puede cambiar el puerto con `PORT`.

## Configuración

Las variables se documentan en `.env.example`. Nunca se versionan credenciales reales.

- Sin `DATABASE_URL`, Corta usa un archivo JSON local para facilitar el desarrollo.
- Con `DATABASE_URL`, usa PostgreSQL para que links y clicks sobrevivan a reinicios y redeploys.

## Estructura

- `server.js`: inicia el proceso y gestiona su cierre ordenado.
- `src/app.js`: configura Express, rutas y manejo de errores.
- `src/link-controller.js`: traduce entre HTTP y los casos de uso.
- `src/link-service.js`: concentra las reglas del acortador.
- `src/repositories/`: persistencia JSON y PostgreSQL.
- `src/short-link.js`: modelo inmutable y normalización de URLs.
- `src/generate-short-code.js`: generación aleatoria de códigos.
- `public/`: interfaz web para acortar y consultar estadísticas.
- `test/`: batería automatizada derivada de `SPEC.md`.
- `SPEC.md`: contrato funcional y casos borde.
- `ARCHITECTURE.md`: límites, dirección de dependencias y decisiones internas.

La arquitectura y su regla de dependencias están detalladas en
[ARCHITECTURE.md](ARCHITECTURE.md).

## API

- `POST /api/links`: crea un link corto.
- `GET /:codigo`: registra un click y redirige al destino.
- `GET /api/links/:codigo/stats`: devuelve URL, clicks y fecha de creación.
- `GET /health`: confirma que el servicio está listo.

El contrato completo, incluidos errores y concurrencia, está en [SPEC.md](SPEC.md).
