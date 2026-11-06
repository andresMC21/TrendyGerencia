# Despliegue de Trendy Gerencia en Render

Creado el 6 de noviembre de 2026 en el espacio `My Workspace`.

| Recurso | Dirección / identificador |
|---|---|
| Web | https://trendy-gerencia-web.onrender.com |
| API | https://trendy-gerencia-api.onrender.com/api |
| Swagger | https://trendy-gerencia-api.onrender.com/api/docs |
| Health | https://trendy-gerencia-api.onrender.com/api/health |
| Servicio web | `srv-dbmvgk95efls738mpj70` |
| Servicio API | `srv-dbmvggdg1s2s73c1d5h0` |
| PostgreSQL 16 | `dpg-dbmvgbui0phs73cusmf0-a` |

Repositorio: https://github.com/andresMC21/TrendyGerencia

Rama configurada en ambos servicios: `main`.
Los recursos se crearon por la API de Render, de forma independiente del
Blueprint `render.yml`, que documenta los nombres y la configuración actuales.

## Actualizar

1. Abrir un pull request con los cambios hacia `main`.
2. Revisar las comprobaciones de GitHub Actions y fusionar el pull request.
3. El workflow `tests` ejecuta las pruebas del commit de `main`. Solo cuando
   pasan los jobs `api` y `web`, el job `deploy` dispara ambos Deploy Hooks.
4. Comprobar en Render que ambos despliegues terminen en `live`. Que GitHub
   indique éxito en `deploy` significa que Render aceptó la solicitud, no que
   haya terminado de compilar y publicar.

El despliegue automático nativo de Render está desactivado para evitar
publicaciones duplicadas o antes de terminar las pruebas. GitHub Actions
envía el SHA exacto del commit probado mediante el parámetro `ref`. Un job
antiguo se omite si ya hay un commit más reciente en `main`. Los pull requests
y los pushes a `develop` no disparan los Deploy Hooks.

La API ejecuta las migraciones y el seed antes de arrancar:
`npm run migration:run:prod && node dist/seed/seed.js && npm run start:prod`.
La web compila con `VITE_API_URL` apuntando a la nueva API e incluye
una reescritura de todas sus rutas a `index.html`.

Las credenciales de la base de datos y el secreto JWT están configurados en
Render; no deben guardarse en Git.

Este despliegue es de demostración: el seed carga cinco usuarios, tres productos,
una transacción y una reseña. Dos productos están disponibles y uno vendido.
Los IDs fijos evitan duplicados; en cada arranque se reponen los valores de
prueba, conservando las contraseñas existentes. Incluye cuentas con las
contraseñas de prueba documentadas en el README.

Acceso de demostración: `demo@trendy.local` / `Trendy123`.

## Configurar los secretos de GitHub Actions

En cada servicio de Render, abrir **Settings → Deploy Hook** y copiar su URL.
En el repositorio, abrir **Settings → Secrets and variables → Actions → New
repository secret** y crear:

| Secreto | URL que debe contener |
|---|---|
| `RENDER_API_DEPLOY_HOOK` | Deploy Hook de `trendy-gerencia-api` |
| `RENDER_WEB_DEPLOY_HOOK` | Deploy Hook de `trendy-gerencia-web` |

Si no tienes acceso a la configuración del repositorio, el propietario debe
crear estos secretos. No pegar las URLs en el código, los PR ni los logs.
Este flujo no requiere instalar la aplicación de Render en GitHub ni compartir
una API Key con acceso al espacio completo de Render.

Referencia: https://render.com/docs/deploy-hooks

## Plan gratuito

La API y PostgreSQL usan el plan gratuito; la web es un sitio estático.
La API puede suspenderse por inactividad y tardar en responder al reactivarse.
La base de datos gratuita vence a los 30 días: exportar los datos o cambiar su
plan antes del vencimiento si deben conservarse.

Referencia: https://render.com/docs/free
