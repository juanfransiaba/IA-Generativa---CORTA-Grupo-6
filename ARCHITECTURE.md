# Arquitectura de Corta

Corta usa una arquitectura por capas liviana. La separación busca que las reglas del
acortador puedan probarse sin Express, PostgreSQL ni el sistema de archivos.

## Regla de dependencias

Las dependencias apuntan hacia el dominio:

```text
server.js
    │
    ▼
composition ─────► presentation
    │                  │
    ├────────────► application ─────► domain
    │                  ▲
    └────────────► infrastructure ───┘
```

- `domain/`: modelo inmutable y normalización pura. No conoce otras capas.
- `application/`: casos de uso y el contrato que debe cumplir un repositorio. No conoce
  Express, archivos, PostgreSQL ni variables de entorno.
- `presentation/`: controllers, presenters, rutas y manejo de errores HTTP. Convierte el
  contrato externo en llamadas a casos de uso, sin implementar reglas de negocio.
- `infrastructure/`: adaptadores JSON/PostgreSQL y generación aleatoria de códigos.
- `composition/`: único lugar que instancia servicios y controllers y conecta dependencias.
- `server.js`: arranque, configuración del proceso y cierre ordenado.

`test/architecture.test.js` protege esta dirección y falla si una capa interna comienza a
importar una capa externa.

## Límites de datos

El modelo interno usa nombres explícitos (`shortCode`, `originalUrl`, `clickCount`,
`createdAt`) y se congela con `Object.freeze`. Los presenters traducen ese modelo al
contrato público en español. Los repositories traducen el modelo a JSON o a las columnas
heredadas de PostgreSQL, por lo que el dominio no depende del formato de persistencia.

Los resultados esperables se representan con un `Result` inmutable: `{ ok: true, value }`
o `{ ok: false, reason }`. Una URL inválida, un código inexistente o una colisión agotada
no lanzan excepciones. Las excepciones quedan reservadas para errores de programación o
fallas inesperadas de infraestructura y se traducen en el borde HTTP.

## Secretos

La aplicación sólo recibe la conexión mediante `process.env.DATABASE_URL` en el punto de
entrada. El reloj (que entrega ISO 8601), el generador aleatorio y el logger también se
inyectan desde `server.js`.
La composición y las capas internas no leen variables globales ni registran el valor de la
conexión. Railway resuelve la referencia al servicio PostgreSQL fuera del repositorio.
