# Especificación funcional de Corta

## 1. Objetivo

Corta recibe una URL HTTP(S), genera un código corto único y permite usarlo para redirigir al destino. También informa estadísticas reales de cada código. La API y la interfaz web comparten la misma fuente de datos.

## 2. Conceptos y datos

Cada link contiene:

- `codigo`: identificador alfanumérico, sensible a mayúsculas y único.
- `url`: URL original, absoluta y con protocolo `http:` o `https:`.
- `clicks`: entero no negativo; comienza en cero.
- `creado`: instante de creación en formato ISO 8601 UTC.

Los códigos heredados de tres caracteres siguen siendo válidos. Los códigos nuevos tienen seis caracteres en minúscula (`a-z`, `0-9`) para reducir colisiones.

## 3. API

### `POST /api/links`

Crea un link a partir de un cuerpo JSON `{ "url": "https://ejemplo.com/ruta" }`.

- Responde `201` con `{ "codigo": "abc123", "corta": "/abc123" }`.
- Conserva la URL suministrada, quitando solo espacios exteriores.
- Rechaza con `400` un cuerpo ausente, JSON inválido, una URL vacía, relativa, malformada o con un protocolo distinto de HTTP(S).
- Una URL puede acortarse más de una vez; cada solicitud crea un link independiente.
- La generación del código y su reserva son atómicas. Si un código ya existe, se genera otro sin sobrescribir ni alterar el link anterior.
- Después de 100 colisiones consecutivas responde `503` sin crear datos parciales.

### `GET /:codigo`

Resuelve un link corto.

- Si existe, incrementa `clicks` exactamente una vez, persiste el incremento y responde con una redirección HTTP `302` a la URL original.
- Si no existe, responde `404` y no modifica ninguna estadística.
- Consultar páginas o endpoints de la aplicación no cuenta como click.

### `GET /api/links/:codigo/stats`

Consulta estadísticas sin incrementar clicks.

- Si existe, responde `200` con `{ "codigo", "url", "clicks", "creado" }`.
- `clicks` coincide con la cantidad de redirecciones exitosas confirmadas para el código.
- Si no existe, responde `404` con un error JSON.

### `GET /health`

- Responde `200` con `{ "status": "ok" }` cuando la aplicación y su almacenamiento están inicializados.
- No revela credenciales ni detalles internos.

## 4. Interfaz web

- La portada permite ingresar una URL, crear el link y mostrar su URL corta absoluta.
- Los errores de validación o del servidor se muestran sin inventar un link.
- `stats.html` permite ingresar un código y muestra URL, clicks y fecha reales obtenidos del endpoint de estadísticas.
- Un código inexistente muestra un mensaje claro y no deja datos de ejemplo en pantalla.

## 5. Persistencia y producción

- En desarrollo se admite un archivo JSON local ignorado por Git.
- En producción se usa PostgreSQL mediante `DATABASE_URL`.
- `codigo` tiene una restricción única/clave primaria en toda implementación de almacenamiento.
- El incremento de clicks es atómico para no perder conteos ante solicitudes concurrentes.
- El esquema se inicializa de forma idempotente al arrancar.
- Los secretos viven únicamente en variables de entorno administradas por Railway y nunca en Git, archivos `.txt`, logs o respuestas HTTP.

## 6. Criterios verificables

La batería automatizada debe cubrir al menos:

- creación válida;
- todas las clases de URL inválida;
- colisión seguida de recuperación;
- agotamiento controlado de colisiones;
- redirección real y cabecera `Location`;
- incremento exacto de clicks, incluidos accesos sucesivos y concurrentes;
- inexistencia en redirect y estadísticas;
- estadísticas fieles y sin efectos secundarios;
- persistencia entre reinicios del almacenamiento local;
- páginas estáticas y healthcheck;
- selección de PostgreSQL cuando existe `DATABASE_URL`.
