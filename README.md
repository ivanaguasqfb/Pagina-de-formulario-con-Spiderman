# Aulaforma · Exámenes

Aplicación para crear exámenes, compartirlos con otros usuarios y consultar las respuestas recibidas.

## Requisitos

- Node.js 24
- npm

## Desarrollo local

```sh
npm install
npm run dev:all
```

Abre la dirección que indique Vite (normalmente `http://localhost:5173`). `dev:all` ejecuta la interfaz y la API; Vite reenvía las peticiones `/api` al servidor en el puerto 3001.

Los datos se guardan en `data/exams.sqlite`, que se crea automáticamente y queda excluida de Git. Para cambiar puerto o ubicación de la base, configura `PORT` o `DATABASE_PATH` en el entorno antes de iniciar el servidor. `.env.example` muestra los valores locales habituales.

## Uso

1. Crea una cuenta con nombre de usuario y contraseña (mínimo 8 caracteres).
2. Crea un examen y agrega preguntas de opción única, opción múltiple o respuesta abierta.
3. Publica el examen; los demás usuarios con cuenta lo encontrarán en **Explorar**.
4. Cada usuario puede enviar una respuesta por examen. El creador ve las respuestas y la calificación automática de preguntas de selección en **Mis exámenes**.

Las respuestas abiertas se muestran al creador y no se califican automáticamente. Las respuestas correctas no se envían a quienes contestan. Las sesiones usan cookies `HttpOnly`; al desplegar, sirve el cliente y la API bajo el mismo origen con HTTPS para habilitar la cookie segura.

## Producción

```sh
npm run build
NODE_ENV=production npm start
```

Sirve el contenido de `dist/` desde el mismo origen (por ejemplo, con un proxy inverso que también reenvíe `/api` al servidor Express). Configura un almacenamiento persistente y protegido para el archivo SQLite. No uses una base de datos local efímera si varias instancias del servidor deben compartir información.
