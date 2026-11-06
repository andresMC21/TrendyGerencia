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
3. Render despliega automáticamente la API y la web al recibir el commit en
   `main` (`autoDeployTrigger: commit`). Verificar las direcciones anteriores.

El despliegue automático está activado. La API ejecuta las migraciones antes
de arrancar. La web compila con `VITE_API_URL` apuntando a la nueva API e incluye
una reescritura de todas sus rutas a `index.html`.

Las credenciales de la base de datos y el secreto JWT están configurados en
Render; no deben guardarse en Git. No se ejecuta el seed de cuentas de prueba.

## Plan gratuito

La API y PostgreSQL usan el plan gratuito; la web es un sitio estático.
La API puede suspenderse por inactividad y tardar en responder al reactivarse.
La base de datos gratuita vence a los 30 días: exportar los datos o cambiar su
plan antes del vencimiento si deben conservarse.

Referencia: https://render.com/docs/free
