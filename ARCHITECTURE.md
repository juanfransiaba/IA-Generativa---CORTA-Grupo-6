# Arquitectura de Corta

Corta separa responsabilidades sin intentar implementar una arquitectura empresarial.
Cada carpeta representa un límite concreto:

```text
server.js → app.js → link-controller.js → link-service.js → repository
```

- `link-controller.js`: traduce HTTP a llamadas del service y arma las respuestas.
- `link-service.js`: contiene validación, creación, colisiones, estadísticas y resolución.
- `repositories/`: implementa persistencia JSON o PostgreSQL sin conocer HTTP.
- `app.js`: conecta las dependencias y declara rutas y middleware de Express.
- `server.js`: lee el entorno, elige persistencia e inicia/cierra el proceso.
- `short-link.js` y `generate-short-code.js`: helpers puros y pequeños.

El controller no consulta datos directamente. El service depende únicamente del contrato
mínimo del repository (`save`, `findByShortCode`, `incrementClickCount`) y no conoce
Express, archivos ni SQL. Los repositories reciben valores del service y las consultas a
PostgreSQL usan parámetros posicionales.

Los resultados esperables —URL inválida, código inexistente o agotamiento de colisiones—
se devuelven como valores `{ ok, value/reason }`; no se lanzan como excepciones. Los links
son objetos inmutables.

Los efectos quedan en los bordes: variables de entorno, reloj y logging en `server.js`;
HTTP en `app.js` y el controller; azar en `generate-short-code.js`; archivos y base de datos
en `repositories/`. `DATABASE_URL` sólo se lee en el arranque y nunca se registra.
