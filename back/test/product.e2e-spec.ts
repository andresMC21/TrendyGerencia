import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

// Usa la BD de pruebas si se define DB_NAME_TEST (con PostGIS instalado)
process.env.DB_NAME = process.env.DB_NAME_TEST ?? process.env.DB_NAME;
process.env.FEED_CACHE_TTL_SECONDS = '0';

const run = Date.now().toString().slice(-6);

describe('Products (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let tokenSeller: string;
  let tokenBuyer: string;
  let productId: string;

  const hood = `hood-${run}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  const newUser = async (n: string) => {
    const user = {
      email: `e2e-${run}-${n}@test.com`,
      password: 'Passw0rd1',
      fullName: `E2E ${n}`,
    };

    await http.post('/api/user/register').send(user).expect(201);

    const res = await http
      .post('/api/user/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    return res.body.token as string;
  };

  const body = (over: object = {}) => ({
    title: 'Bicicleta MTB',
    description: 'Rin 26',
    price: 250000,
    acceptsBarter: true,
    category: 'deportes',
    condition: 'COMO_NUEVO',
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: hood,
    estimatedWeightKg: 14.5,
    ...over,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    http = request(app.getHttpServer());

    tokenSeller = await newUser('1');
    tokenBuyer = await newUser('2');
  });

  afterAll(async () => {
    const ds = app.get(DataSource);
    await ds.query(`DELETE FROM product WHERE "neighborhoodId" = $1`, [hood]);
    await ds.query(`DELETE FROM "user" WHERE email LIKE $1`, [`e2e-${run}-%`]);
    await app.close();
  });

  it('POST /products exige autenticación', () =>
    http.post('/api/products').send(body()).expect(401));

  it('POST /products valida el body', async () => {
    const res = await http
      .post('/api/products')
      .set(auth(tokenSeller))
      .send(
        body({
          price: -5,
          location: { lat: 99, lng: 0 },
          extra: 1,
        }),
      )
      .expect(400);

    expect(res.body.message.join()).toMatch(/price|lat|extra/);
  });

  it('POST /products crea el producto', async () => {
    const res = await http
      .post('/api/products')
      .set(auth(tokenSeller))
      .send(body())
      .expect(201);

    expect(res.body).toMatchObject({
      status: 'AVAILABLE',
      price: 250000,
      location: { lat: 3.4516, lng: -76.532 },
    });

    productId = res.body.id;
  });

  it('GET /products filtra por barrio y es público', async () => {
    const res = await http
      .get('/api/products')
      .query({ neighborhood: hood })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe(productId);
  });

  it('HU-09 · GET /products filtra por neighborhoodId sin token y sin distinguir mayúsculas', async () => {
    const res = await http
      .get('/api/products')
      .query({ neighborhoodId: ` ${hood.toUpperCase()} ` })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe(productId);

    const otro = await http
      .get('/api/products')
      .query({ neighborhoodId: `otro-${hood}` })
      .expect(200);

    expect(otro.body.total).toBe(0);
  });

  it('GET /products con lat/lng/radius usa PostGIS', async () => {
    const near = await http
      .get('/api/products')
      .query({
        neighborhood: hood,
        lat: 3.452,
        lng: -76.531,
        radius: 2,
        sort: 'distance',
      })
      .expect(200);

    expect(near.body.items[0].distanceKm).toBeLessThan(1);

    const far = await http
      .get('/api/products')
      .query({
        neighborhood: hood,
        lat: 4.7,
        lng: -74.0,
        radius: 5,
      })
      .expect(200);

    expect(far.body.total).toBe(0);
  });

  it('GET /products rechaza filtros inválidos', async () => {
    await http.get('/api/products').query({ lat: 3.4 }).expect(400);
    await http.get('/api/products').query({ sort: 'distance' }).expect(400);
    await http.get('/api/products').query({ limit: 500 }).expect(400);
  });

  it('GET /products/:id devuelve detalle con vendedor y suma visitas', async () => {
    const a = await http.get(`/api/products/${productId}`).expect(200);
    const b = await http.get(`/api/products/${productId}`).expect(200);

    expect(b.body.viewsCount).toBe(a.body.viewsCount + 1);
    expect(a.body.seller).toMatchObject({ fullName: 'E2E 1' });
    expect(a.body.seller.password).toBeUndefined();
    expect(a.body.seller.email).toBeUndefined();
  });

  it('GET /products/:id valida UUID y 404', async () => {
    await http.get('/api/products/no-es-uuid').expect(400);
    await http
      .get('/api/products/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('PUT /products/:id solo lo edita el dueño', async () => {
    await http
      .put(`/api/products/${productId}`)
      .set(auth(tokenBuyer))
      .send({ price: 1 })
      .expect(403);

    const res = await http
      .put(`/api/products/${productId}`)
      .set(auth(tokenSeller))
      .send({ price: 200000 })
      .expect(200);

    expect(res.body.price).toBe(200000);
  });

  it('POST /products/:id/favorite alterna el favorito', async () => {
    expect(
      (
        await http
          .post(`/api/products/${productId}/favorite`)
          .set(auth(tokenBuyer))
          .expect(200)
      ).body,
    ).toEqual({ isFavorite: true });

    expect(
      (await http.get(`/api/products/${productId}`)).body.favoritesCount,
    ).toBe(1);

    expect(
      (
        await http
          .post(`/api/products/${productId}/favorite`)
          .set(auth(tokenBuyer))
          .expect(200)
      ).body,
    ).toEqual({ isFavorite: false });
  });

  it('DELETE /products/:id: 403 a otros, 204 al dueño y luego 404', async () => {
    await http
      .delete(`/api/products/${productId}`)
      .set(auth(tokenBuyer))
      .expect(403);

    await http
      .delete(`/api/products/${productId}`)
      .set(auth(tokenSeller))
      .expect(204);

    await http.get(`/api/products/${productId}`).expect(404);

    const list = await http
      .get('/api/products')
      .query({ neighborhood: hood })
      .expect(200);

    expect(list.body.total).toBe(0);

    const byId = await http
      .get('/api/products')
      .query({ neighborhoodId: hood })
      .expect(200);

    expect(byId.body.total).toBe(0);
  });

  describe('HU-14 · Gestionar favoritos', () => {
    let favId: string;
    let tokenOther: string;
    const favRows = async (pid: string) =>
      (await app
        .get(DataSource)
        .query(
          'SELECT "userId" FROM product_favorites WHERE "productId" = $1',
          [pid],
        )) as { userId: string }[];

    beforeAll(async () => {
      // Producto propio de este bloque, independiente del resto de pruebas.
      const created = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(body({ title: 'Favorito HU-14' }))
        .expect(201);
      favId = created.body.id;
      tokenOther = await newUser('3');
    });

    it('exige sesión: sin JWT responde 401', async () => {
      await http.put(`/api/products/${favId}/favorite`).expect(401);
      await http.delete(`/api/products/${favId}/favorite`).expect(401);
      await http.get('/api/products/favorites').expect(401);
    });

    it('criterio 1: puedo marcar un producto y aparece en mi lista (y solo en la mía)', async () => {
      const res = await http
        .put(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);
      expect(res.body).toEqual({ isFavorite: true });

      const mine = await http
        .get('/api/products/favorites')
        .set(auth(tokenBuyer))
        .expect(200);
      expect(mine.body.map((p: { id: string }) => p.id)).toEqual([favId]);
      expect(mine.body[0].favoritesCount).toBe(1);

      // La lista es autenticada y personal: otro usuario no la ve.
      const other = await http
        .get('/api/products/favorites')
        .set(auth(tokenOther))
        .expect(200);
      expect(other.body).toEqual([]);
    });

    it('criterio 1: marcar un producto inexistente (404) o con id inválido (400)', async () => {
      await http
        .put('/api/products/00000000-0000-4000-8000-000000000000/favorite')
        .set(auth(tokenBuyer))
        .expect(404);
      await http
        .put('/api/products/no-es-uuid/favorite')
        .set(auth(tokenBuyer))
        .expect(400);
    });

    it('criterio 2: marcarlo de nuevo no duplica la combinación usuario-producto', async () => {
      await http
        .put(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);
      await http
        .put(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);

      expect(await favRows(favId)).toHaveLength(1);
      expect(
        (await http.get(`/api/products/${favId}`)).body.favoritesCount,
      ).toBe(1);
    });

    it('criterio 2: varias peticiones simultáneas tampoco duplican ni fallan', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          http.put(`/api/products/${favId}/favorite`).set(auth(tokenOther)),
        ),
      );

      expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
      // Dos usuarios (comprador y otro), una fila por cada uno.
      expect(await favRows(favId)).toHaveLength(2);
    });

    it('criterio 3: retirarlo de favoritos no afecta la publicación', async () => {
      const before = (await http.get(`/api/products/${favId}`)).body;

      const res = await http
        .delete(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);
      expect(res.body).toEqual({ isFavorite: false });

      // Ya no está en mi lista...
      const mine = await http
        .get('/api/products/favorites')
        .set(auth(tokenBuyer))
        .expect(200);
      expect(mine.body).toEqual([]);

      // ...pero la publicación sigue igual, y el favorito de otro usuario se conserva.
      const after = (await http.get(`/api/products/${favId}`).expect(200)).body;
      expect(after).toMatchObject({
        id: favId,
        title: before.title,
        status: before.status,
        price: before.price,
      });
      expect(after.favoritesCount).toBe(1);
      expect(await favRows(favId)).toHaveLength(1);
    });

    it('criterio 3: quitar algo que no era favorito responde igual (idempotente)', async () => {
      const res = await http
        .delete(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);
      expect(res.body).toEqual({ isFavorite: false });

      await http
        .delete('/api/products/00000000-0000-4000-8000-000000000000/favorite')
        .set(auth(tokenBuyer))
        .expect(404);
    });

    it('un producto retirado por su vendedor sale de mi lista pero puedo limpiarlo', async () => {
      await http
        .put(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);

      await http
        .delete(`/api/products/${favId}`)
        .set(auth(tokenSeller))
        .expect(204);

      const mine = await http
        .get('/api/products/favorites')
        .set(auth(tokenBuyer))
        .expect(200);
      expect(mine.body).toEqual([]);

      // Retirado: ya no se puede marcar, pero sí quitar de favoritos.
      await http
        .put(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(404);
      await http
        .delete(`/api/products/${favId}/favorite`)
        .set(auth(tokenBuyer))
        .expect(200);
    });
  });
});
