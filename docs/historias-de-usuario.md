# Historias de usuario del Sprint 1: estado y evidencias

Toda la documentación del proyecto está en esta carpeta (`docs/`), junto con el informe técnico en PDF. Cada historia tiene su documento con los criterios de aceptación, cómo se cumplen y las pruebas que lo demuestran. Las pruebas se ejecutan con `npm run test:cov` y `npm run test:e2e` en `back/` (y en GitHub Actions, workflow `tests`).

| HU | Historia | API | Web | Documento |
|---|---|---|---|---|
| HU-01 | Crear una cuenta | `POST /user/register` | `/registro` | [HU-01](HU-01.md) |
| HU-02 | Iniciar sesión | `POST /user/login`, `@Auth()` | `/ingresar` | [HU-02](HU-02.md) |
| HU-03 | Consultar mi perfil | `GET /user/me`, `PATCH /user/me` (foto) | `/perfil` | [HU-03](HU-03.md) |
| HU-05 | Actualizar mis credenciales | `PATCH /user/me/email`, `PATCH /user/me/password` | `/perfil` | [HU-05](HU-05.md) |
| HU-08 | Publicar un producto | `POST /products` | `/publicar` | [HU-08](HU-08.md) |
| HU-09 | Explorar el barrio | `GET /products?neighborhoodId=` | `/explorar` | [HU-09](HU-09.md) |
| HU-11 | Consultar un producto | `GET /products/:id` | `/producto/:id` | [HU-11](HU-11.md) |
| HU-13 | Retirar una publicación | `DELETE /products/:id`, `GET /products/mine` | `/mis-publicaciones` | [HU-13](HU-13.md) |
| HU-14 | Gestionar favoritos | `PUT` y `DELETE /products/:id/favorite`, `GET /products/favorites` | `/favoritos`, `/producto/:id` | [HU-14](HU-14.md) |
| HU-15 | Iniciar una transacción | `POST /transactions` | `/producto/:id` | [HU-15](HU-15.md) |
| HU-16 | Acordar una entrega | `POST /transactions/:id/meeting-proposal` (`/accept`, `/reject`) | `/transacciones/:id` | [HU-16](HU-16.md) |
| HU-17 | Finalizar o cancelar intercambio | `POST /transactions/:id/confirm-exchange` (vendido / recibido), `PUT /transactions/:id/status` (cancelar) | `/transacciones/:id` | [HU-17](HU-17.md) |

## Usuarios de prueba

Con `npm run seed`: `demo@trendy.local` / `Trendy123` (usuario fijo), `ana@trendy.local` / `Ana12345` (vendedora verificada), `carlos@trendy.local` / `Carlos12`, `admin@trendy.local` / `Admin1234`, `moderador@trendy.local` / `Mod12345`, y para la demo de compra `maria.compradora@trendy.local` / `Maria2026` (compradora) y `camilo.vendedor@trendy.local` / `Camilo2026` (vende un escritorio y una lámpara).
