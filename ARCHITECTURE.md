# Arquitectura

Corta utiliza una arquitectura en capas simple. El objetivo es separar el transporte HTTP,
las reglas de negocio y la persistencia para que cada parte pueda evolucionar y probarse de
forma independiente.

## Componentes

```text
Cliente HTTP
    ↓
Aplicación y rutas
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
JSON o PostgreSQL
```

- `server.js`: punto de entrada. Lee la configuración, crea las dependencias e inicia el
  servidor.
- `src/app.js`: configura Express, las rutas, los archivos estáticos y el manejo general de
  errores.
- `src/link-controller.js`: adapta requests y responses HTTP a operaciones del service.
- `src/link-service.js`: implementa los casos de uso y las reglas del acortador.
- `src/repositories/`: contiene los adaptadores de persistencia y su factory.
- `src/short-link.js`: define y normaliza el modelo interno de un link corto.
- `src/generate-short-code.js`: genera los códigos utilizados por los links nuevos.

## Límites y dependencias

El controller conoce el service, pero no accede directamente a la base de datos. El service
trabaja contra las operaciones mínimas de un repository y no depende de Express, archivos o
SQL. Cada repository se ocupa exclusivamente de traducir el modelo interno a su mecanismo de
persistencia.

Las dependencias externas —repository, reloj, generador de códigos y logger— se inyectan al
crear la aplicación. Esto permite reemplazarlas en tests sin modificar las reglas de negocio.

## Datos y persistencia

Los links se representan internamente con `shortCode`, `originalUrl`, `clickCount` y
`createdAt`. Se utilizan objetos inmutables para evitar modificaciones accidentales.

En desarrollo puede utilizarse un archivo JSON. En producción se utiliza PostgreSQL. La
selección se realiza al iniciar la aplicación y ambos adapters ofrecen las mismas operaciones.
Las consultas SQL que reciben datos externos utilizan parámetros posicionales.

## Manejo de resultados

Los resultados normales del negocio, como una URL inválida o un código inexistente, se
representan como valores explícitos. Las excepciones se reservan para errores inesperados de
configuración o infraestructura y se traducen en el límite HTTP.
