# Trendy API


Backend del marketplace hiperlocal de segunda mano Trendy, desarrollado con NestJS, TypeORM y PostgreSQL + PostGIS para el taller de *Computación en Internet III* (Universidad Icesi).

Los usuarios publican productos, los encuentran por barrio o cercanía geográfica, acuerdan la entrega en un punto seguro y se califican entre sí al terminar la transacción.

## Enlaces

| Recurso | URL |
|---|---|
| Repositorio | https://github.com/andresMC21/Trendy |
| Aplicación desplegada (Render) | https://trendy-app-web-un9c.onrender.com/api |
| Documentación Swagger | https://trendy-app-web-un9c.onrender.com/api/docs |
| Health check | https://trendy-app-web-un9c.onrender.com/api/health |
| Página web (Render, sitio estático `trendy-web`) | La URL que asigna Render al sincronizar `render.yml` (ver *CI/CD y despliegue*) |

> El plan gratuito de Render duerme el servicio tras un rato sin tráfico: la primera petición puede tardar ~1 minuto.

## Funcionalidades

| Módulo | Qué hace |  |
|---|---|---|
| **Usuarios** (`/user`, `/admin/users`, `/moderation`) | Registro, login con JWT, perfil, cambio de contraseña y correo, verificación de identidad, administración de usuarios (roles, activar/desactivar) y moderación |  |
| **Productos** (`/products`) | Publicar, editar y eliminar productos; feed por barrio o cercanía (PostGIS); filtros, orden, paginación; favoritos |  |
| **Transacciones** (`/transactions`) | Intención de compra o trueque, punto seguro y horario, cierre o cancelación; actualiza el estado del producto |  |
| **Reseñas** (`/review`) | Calificación (1–5) entre participantes de una transacción completada; recalcula el promedio del usuario |  |
| **Health** (`/health`) | Comprobación de disponibilidad | — |

**Autenticación:** JWT (Bearer, expira en 1 h) 

**Autorización:** roles `ADMIN`, `MODERATOR` y `USER` 

 **Persistencia:** TypeORM + migraciones sobre PostgreSQL/PostGIS.

## Tecnologías

NestJS 12 · TypeScript · TypeORM · PostgreSQL 16 + PostGIS · Passport JWT · bcrypt · class-validator · Swagger (OpenAPI) · Jest + Supertest · Postman/Newman · GitHub Actions · Render.

## Requisitos

- **Node.js 24** (`node -v` debe mostrar v24 o superior; con nvm: `nvm install 24`)
- **Docker Desktop** abierto (para la base de datos PostgreSQL + PostGIS)
- npm

## Cómo ejecutar Trendy (paso a paso)

El proyecto tiene tres piezas que se ejecutan en este orden:

| Pieza | Carpeta | Dirección |
|---|---|---|
| Base de datos PostgreSQL + PostGIS | servicio `db` de `docker-compose.yml` (contenedor `trendy-db`) | `localhost:5433` (base `trendy`, usuario `trendy`, clave `trendy`) |
| API (NestJS) | `back/` | http://localhost:3000/api · Swagger en http://localhost:3000/api/docs |
| Página web (React + Vite) | `web/` | http://localhost:5173 |

### Opción A · Un solo clic (macOS)

1. Abre Docker Desktop y espera a que diga *Engine running*.
2. En Finder, abre la carpeta del repositorio y haz doble clic en **`iniciar-trendy.command`**.
   (Si macOS lo bloquea la primera vez: clic derecho → *Abrir* → *Abrir*.)
3. El script levanta la base de datos con `docker compose`, crea `back/.env` si no existe, aplica las migraciones, carga el seed (incluido el usuario fijo), levanta la API y abre la web en el navegador.
4. Para detener todo, presiona `Ctrl + C` en la ventana de Terminal. La base de datos sigue en Docker con tus datos.

Los registros quedan en `.trendy-logs/` (`iniciar.log` y `api.log`).

### Opción B · Todo con Docker (Windows, Linux o Mac, sin instalar Node)

Solo necesitas Docker Desktop. Desde la raíz del repositorio:

```bash
docker compose --profile completo up -d --build
```

Esto levanta la base de datos, la API (aplica migraciones y carga el seed con el usuario fijo) y la web:

- Web: http://localhost:5173
- API: http://localhost:3000/api · Swagger: http://localhost:3000/api/docs

Para apagar: `docker compose --profile completo down` (los datos se conservan en el volumen `trendy_trendy-db-data`; con `down -v` se borran).

### Opción C · Base de datos en Docker + API y web con npm (para desarrollar)

**1. Base de datos**

```bash
docker compose up -d db      # crea y enciende el contenedor trendy-db (PostGIS) en el puerto 5433
```

**2. API**

```bash
cd back
npm install
cp .env.example .env         # ya trae los datos de conexión de docker-compose.yml
npm run migration:run        # crea las tablas
npm run seed                 # datos de ejemplo + usuario fijo
npm run start:dev            # http://localhost:3000/api
```

**3. Página web** (en otra terminal)

```bash
cd web
npm install
npm run dev                  # http://localhost:5173
```

Para usar la API desplegada en vez de la local: `VITE_API_URL=https://trendy-app-web-un9c.onrender.com/api npm run dev`.

### Archivos de configuración

| Archivo | Para qué sirve |
|---|---|
| `docker-compose.yml` | Define `db` (PostGIS) y, con el perfil `completo`, `api` y `web`. |
| `.env.example` (raíz) | Variables opcionales de docker compose (puertos, usuario y clave de la base). Cópialo como `.env` solo si quieres cambiarlas. |
| `back/.env.example` | Configuración de la API cuando corre con npm. Cópialo como `back/.env`. |
| `web/.env.example` | URL de la API para la web (opcional). |
| `back/Dockerfile`, `web/Dockerfile` | Imágenes de la API y de la web que usa el perfil `completo`. |

Los archivos `.env` reales no se suben al repositorio (están en `.gitignore`); los `.env.example` traen valores que funcionan tal cual para desarrollo local.

### Usuario fijo

| Correo | Contraseña |
|---|---|
| `demo@trendy.local` | `Trendy123` |

- **Dónde se define:** `back/src/seed/seed-data.ts` (lista `seedUsers`, último elemento, id `55555555-5555-4555-8555-555555555555`).
- **Dónde se guarda:** en la tabla `"user"` de la base `trendy` (contenedor `trendy-db`). Lo crea `npm run seed`, que se puede ejecutar varias veces sin duplicarlo.
- **Verlo en la base de datos:**

  ```bash
  docker exec -it trendy-db psql -U trendy -d trendy \
    -c 'SELECT email, "fullName", role, "isActive" FROM "user";'
  ```

### Scripts (`npm run`)

| Comando | Descripción |
|---|---|
| `npm run start` | Inicia la API |
| `npm run start:dev` | Inicia con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:generate -- src/database/migrations/Nombre` | Genera una migración a partir de los cambios en las entidades |
| `npm run seed` | Carga los datos iniciales |
| `npm run lint` | Análisis estático (oxlint) |
| `npm run test` | Pruebas unitarias |
| `npm run test:cov` | Pruebas unitarias con cobertura (umbral mínimo 80 %) |
| `npm run test:e2e` | Pruebas de integración (necesitan base de datos) |

## Usuarios de prueba (seed)

### Interfaz, fotografías y nuevos datos de demostración

- La lámpara del encabezado alterna entre modo claro y oscuro: arrastra el cordón hacia abajo, haz clic o usa Enter/Espacio. La preferencia se conserva en este navegador; inicialmente se respeta el tema del sistema.
- En `/ingresar`, el formulario comienza oculto. La lámpara central lo muestra u oculta con la misma interacción. La lámpara del encabezado cambia únicamente el tema.
- Publicar desde la web requiere una fotografía JPG, PNG o WebP de hasta 10 MB. Se muestra una vista previa y se reduce localmente a JPEG de hasta 1200 px, antes de enviarla. Se almacena en PostgreSQL como data URL; no necesita un servicio externo de almacenamiento.
- `POST /api/products` y `PUT /api/products/:id` aceptan `photoUrl`: data URL JPEG/PNG/WebP de hasta 900000 caracteres, o ruta del catálogo `/images/products/*.jpg`. El campo sigue siendo opcional para clientes anteriores. Las lecturas devuelven `photoUrl: null` para productos antiguos sin fotografía. El límite del cuerpo JSON de la API es 1 MB.
- Ejecuta `npm run migration:run` y luego `npm run seed` desde `back/`. La nueva migración añade una columna nullable sin eliminar publicaciones. El seed incluye 15 productos con precios en COP, detalles de uso, trueques, donaciones y barrios de Cali; conserva los estados y las visitas de productos existentes.
- Los perfiles y las publicaciones de demostración son ficticios. Las fotografías son referencias, no objetos realmente a la venta; se sirven desde `web/public/images/products/` con fuentes en `SOURCES.md`.
- Nuevas cuentas: `valentina@trendy.local` / `Valen2026`, `santiago@trendy.local` / `Santi2026`, `luisa@trendy.local` / `Luisa2026`, `andres@trendy.local` / `Andres2026`. La cuenta `demo@trendy.local` / `Trendy123` continúa disponible.

| Correo | Contraseña | Rol | Notas |
|---|---|---|---|
| `admin@trendy.local` | `Admin1234` | ADMIN | Usuario administrador inicial |
| `moderador@trendy.local` | `Mod12345` | MODERATOR | Revisa verificaciones |
| `ana@trendy.local` | `Ana12345` | USER | Verificada; vende 2 productos |
| `carlos@trendy.local` | `Carlos12` | USER | Sin verificar; vende 1 producto y compró uno de Ana |
| `demo@trendy.local` | `Trendy123` | USER | Usuario fijo para probar la página web |
| `maria.compradora@trendy.local` | `Maria2026` | USER | Verificada; compradora para la demo de HU-15 a HU-17 |
| `camilo.vendedor@trendy.local` | `Camilo2026` | USER | Verificado; vende **Escritorio de madera con cajones** y **Lámpara de pie** (El Ingenio) |

El seed también crea 5 productos, 1 transacción completada y 1 reseña de ejemplo. Se puede ejecutar varias veces: los productos que ya existen conservan su estado (reservado, vendido o retirado), así que reiniciar la API no interrumpe una compra en curso.

**Demo de compra completa:** María abre **Escritorio de madera con cajones**, inicia la compra y propone un punto; Camilo acepta la propuesta (HU-16). Después del encuentro, Camilo marca **Producto vendido** y María **Producto recibido**; con las dos en verde el intercambio queda completado (HU-17).

## Cómo probar cada funcionalidad

Hay tres formas, de la más rápida a la más completa:

### Swagger (interfaz web)

1. Abre `/api/docs`.
2. En **Users → POST /api/user/login** pulsa *Try it out*, usa un usuario del seed y copia el `token` de la respuesta.
3. Pulsa **Authorize** (candado), pega el token y confirma.
4. Prueba cualquier endpoint: cada operación indica en su descripción qué rol necesita y qué errores puede devolver.

### Postman (todos los endpoints)

La colección `postman/trendy-api.postman_collection.json` cubre todos los endpoints (179 requests, 260 aserciones) e incluye casos de éxito y de error (400, 401, 403, 404, 409).

1. Importa el archivo en Postman.
2. Asegúrate de que la API esté corriendo y de haber ejecutado `npm run seed` (la colección usa el admin del seed).
3. Ejecuta la colección **completa y en orden** con *Collection Runner → Run*. Los tokens y los ids se guardan solos en variables.
4. Para apuntar a la app desplegada, cambia la variable `baseUrl` por `https://trendy-app-web-un9c.onrender.com/api`.


### Qué probar y con qué usuario

| Funcionalidad | Endpoints | Usuario |
|---|---|---|
| Registro e inicio de sesión | `POST /user/register`, `POST /user/login` | cualquiera |
| Rutas protegidas (401 sin token) | `GET /user/me` | cualquiera |
| Perfil, contraseña, correo | `PATCH /user/me`, `/me/password`, `/me/email` | cualquiera |
| Solicitar verificación de identidad | `POST /user/me/verification` | `carlos` |
| Aprobar o rechazar verificaciones | `GET /moderation/verifications`, `PATCH /moderation/verifications/:userId` | `moderador` o `admin` |
| Administrar usuarios y **roles** | `/admin/users` (listar, editar, `/role`, `/active`, `DELETE`) | `admin` (el `moderador` solo lee) |
| Probar que un `USER` no accede a rutas admin (403) | `GET /admin/users` | `ana` |
| Publicar y editar productos | `POST /products`, `PUT /products/:id` | `ana` |
| Retirar una publicación (HU-13, borrado lógico → `REMOVED`) y ver mis publicaciones | `DELETE /products/:id`, `GET /products/mine` · web: `/mis-publicaciones` | dueño (`ana`); otro `USER` recibe 403 |
| Feed por barrio / cercanía / filtros | `GET /products?neighborhoodId=…&lat=…&lng=…&radius=…` | público |
| Favoritos | `POST /products/:id/favorite` | cualquiera autenticado |
| Compra: reservar → el comprador propone punto → el vendedor acepta → vendido + recibido | `POST /transactions`, `POST /transactions/:id/meeting-proposal`, `POST /transactions/:id/meeting-proposal/accept` (o `/reject`), `POST /transactions/:id/confirm-exchange` (cada uno), `PUT /transactions/:id/status` para cancelar | `carlos` compra, `ana` vende |
| Reseñas tras una compra completada | `POST /review`, `GET /review` | comprador y vendedor |

### Explorar el barrio (HU-09)

La página pública **`/explorar`** (http://localhost:5173/explorar) permite consultar los productos sin iniciar sesión. Se llega desde el enlace **Explorar** del encabezado y desde el botón **Explorar productos** de la portada.

- **Filtros:** barrio, categoría y condición, con paginación de 12 en 12. Quedan en la URL, así que se pueden compartir: `/explorar?barrio=granada&categoria=hogar&condicion=USADO&pagina=2`.
- **En `/inicio`:** la sección «Todos los productos» muestra lo más reciente de toda Cali. **Ver todos los productos** abre la lista completa y **Productos de mi barrio** abre el último barrio elegido.
- **En la API:** `GET /products?neighborhoodId=granada` filtra por barrio y no distingue mayúsculas. `neighborhood` sigue funcionando como alias obsoleto; si se envían ambos, manda `neighborhoodId`.
- **Publicaciones retiradas:** el feed solo devuelve productos `AVAILABLE`, así que las `REMOVED` nunca aparecen.

Más detalle en [`docs/HU-09.md`](docs/HU-09.md).

## Pruebas automatizadas

```bash
npm run test        # unitarias
npm run test:cov    # unitarias + cobertura 
```

| Tipo | Herramienta | Resultado |
|---|---|---|
| Unitarias | Jest | 25 suites, 326 pruebas pasan |
| Cobertura | Jest | Sentencias 90.9 % · Ramas 80.8 % · Funciones 85.4 % · Líneas 90.4 % (umbral exigido: 80 %) |
| Integración | Jest + Supertest + PostGIS | 4 suites, 73 pruebas pasan (health, usuarios, productos, transacciones) |
| Manuales / regresión | Postman (Newman) | 160 requests, 452 aserciones, 0 fallos (`npx newman run back/postman/TrendyAPI.postman_collection.json` con la API local y el seed cargado) |

### Pruebas de integración

Las pruebas de integración levantan la aplicación completa contra una base PostgreSQL + PostGIS real. Se ejecutan automáticamente en GitHub Actions (workflow `tests`) en cada push y pull request a `main` y `develop`: el workflow crea el servicio de base de datos, aplica las migraciones y corre `test:cov` y `test:e2e`. El detalle de qué prueba cubre cada criterio de aceptación está en [`docs/historias-de-usuario.md`](docs/historias-de-usuario.md).

## CI/CD y despliegue

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `tests` (`.github/workflows/tests.yml`) | push y PR a `main` / `develop` | API: levanta Postgres + PostGIS, aplica migraciones, lint, pruebas unitarias con cobertura, pruebas de integración y compilación. Web: lint y compilación |

**Despliegue:** Render, definido en `render.yml` (Blueprint), con tres piezas:

| Servicio | Tipo | Qué hace |
|---|---|---|
| `trendy-app-db` | PostgreSQL | Base de datos (TypeORM crea `postgis` y `uuid-ossp` si faltan). |
| `trendy-app-web` | Web service (Node, `back/`) | API: aplica las migraciones y arranca (`/api/health` como health check). `JWT_SECRET` lo genera Render. |
| `trendy-web` | Sitio estático (`web/`) | Página web; `VITE_API_URL` apunta a la API desplegada y todas las rutas sirven `index.html`. |

Render despliega la rama **`main`**. Para publicar lo que está en `develop`:

1. Abrir un PR `develop → main`, revisarlo y hacer merge.
2. En Render: *Blueprints* → el blueprint de Trendy → *Sync* (crea `trendy-web` la primera vez y aplica los cambios de `render.yml`).
3. Comprobar `https://trendy-app-web-un9c.onrender.com/api/health` y abrir la URL del sitio `trendy-web` que muestra Render.

El despliegue de demostración ejecuta las migraciones y el seed antes de iniciar la API: `npm run migration:run:prod && node dist/seed/seed.js && npm run start:prod`. Carga las cuentas de prueba de este README y los productos de ejemplo. Los IDs fijos evitan duplicados, pero cada arranque repone los valores de prueba; las contraseñas existentes se conservan.

## Estructura del proyecto

```
src/
├── main.ts                  # Arranque: prefijo /api, validación global, Swagger
├── app.module.ts            # Configuración global y conexión a la base de datos
├── health.controller.ts
├── common/                  # Esquemas de error compartidos para Swagger
├── database/
│   ├── data-source.ts       # DataSource de TypeORM (CLI de migraciones)
│   └── migrations/          # Migraciones del esquema
├── seed/                    # Datos iniciales (npm run seed)
├── user/                    # Usuarios, auth (JWT), roles, administración, moderación
│   ├── decorators/          # @Auth(), @GetUser(), @RoleProtected()
│   ├── guards/              # UserRoleGuard
│   └── strategies/          # JwtStrategy
├── product/                 # Productos, feed geográfico, favoritos
├── transaction/             # Compra/trueque y máquina de estados
└── review/                  # Reseñas y promedio de calificación
test/                        # Pruebas de integración (Supertest)
web/                         # Página web (React + Vite): portada, explorar, registro, ingreso, Mi Trendy
postman/                     # Colección de Postman
docs/                        # Documentación: una ficha por HU, matriz de historias e informe técnico (PDF)
```

## Documentación adicional

- **Swagger / OpenAPI:** `/api/docs` — parámetros, cuerpos, respuestas y errores de cada endpoint.
- **Informe técnico:** descripción detallada de endpoints, autenticación, autorización, persistencia y pruebas (se entrega en la tarea de Intu).

## Alcance y limitaciones conocidas

- La sesión es JWT sin estado (1 h de vigencia): cerrar sesión consiste en descartar el token en el cliente; no hay lista de revocación ni *refresh token*.
- **No** hay autenticación de dos factores (2FA).
- El feed de productos usa una **caché en memoria** (no Redis), por lo que no se comparte entre varias instancias.
- La cuenta no guarda un barrio: «Productos de mi barrio» usa el último barrio elegido en `/explorar`, recordado solo en ese dispositivo.
- `reason` en la resolución de verificaciones se registra en logs, no se guarda en el perfil.
