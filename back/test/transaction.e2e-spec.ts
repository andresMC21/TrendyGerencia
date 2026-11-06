import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

process.env.DB_NAME = process.env.DB_NAME_TEST ?? process.env.DB_NAME;
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_NAME = process.env.DB_NAME ?? 'trendy';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'trendy';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'trendy';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.FEED_CACHE_TTL_SECONDS = '0';

const run = Date.now().toString().slice(-6);

jest.setTimeout(40000);

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let tokenSeller: string;
  let tokenBuyer: string;
  let tokenOther: string;
  let productId: string;
  let transactionId: string;

  const hood = `transactions-${run}`;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const newUser = async (name: string) => {
    const user = {
      email: `transaction-e2e-${run}-${name}@test.com`,
      password: 'Passw0rd1',
      fullName: `Transaction E2E ${name}`,
    };

    await http.post('/api/user/register').send(user).expect(201);

    const res = await http
      .post('/api/user/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    return res.body.token as string;
  };

  const productBody = (over: object = {}) => ({
    title: 'Producto para transaccion',
    description: 'Producto creado por pruebas e2e de transacciones',
    price: 150000,
    acceptsBarter: false,
    category: 'tecnologia',
    condition: 'USADO',
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: hood,
    estimatedWeightKg: 2,
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

    tokenSeller = await newUser('seller');
    tokenBuyer = await newUser('buyer');
    tokenOther = await newUser('other');
  });

  afterAll(async () => {
    if (!app) return;

    const ds = app.get(DataSource);
    await ds.query(
      `DELETE FROM "transaction" WHERE "productId" IN (SELECT id FROM product WHERE "neighborhoodId" = $1)`,
      [hood],
    );
    await ds.query(`DELETE FROM product WHERE "neighborhoodId" = $1`, [hood]);
    await ds.query(`DELETE FROM "user" WHERE email LIKE $1`, [
      `transaction-e2e-${run}-%`,
    ]);
    await app.close();
  });

  it('crea un producto disponible para iniciar la transaccion', async () => {
    // Arrange / Act
    const res = await http
      .post('/api/products')
      .set(auth(tokenSeller))
      .send(productBody())
      .expect(201);

    // Assert
    expect(res.body.status).toBe('AVAILABLE');
    productId = res.body.id;
  });

  it('POST /transactions exige autenticacion', () =>
    http.post('/api/transactions').send({ productId }).expect(401));

  it('POST /transactions valida el body', async () => {
    // Act
    const res = await http
      .post('/api/transactions')
      .set(auth(tokenBuyer))
      .send({ productId: 'no-es-uuid', extra: true })
      .expect(400);

    // Assert
    expect(res.body.message.join()).toMatch(/productId|extra/);
  });

  it('POST /transactions rechaza que el vendedor compre su propio producto', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenSeller))
      .send({ productId })
      .expect(403));

  it('POST /transactions crea la transaccion y reserva el producto', async () => {
    // Act
    const res = await http
      .post('/api/transactions')
      .set(auth(tokenBuyer))
      .send({ productId })
      .expect(201);

    // Assert
    expect(res.body).toMatchObject({
      productId,
      status: 'PENDING',
      safePointId: null,
      scheduledTime: null,
    });
    transactionId = res.body.id;

    const product = await http.get(`/api/products/${productId}`).expect(200);
    expect(product.body.status).toBe('RESERVED');
  });

  it('POST /transactions rechaza producto con transaccion activa', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenOther))
      .send({ productId })
      .expect(409));

  it('GET /transactions lista transacciones del usuario autenticado', async () => {
    // Act
    const res = await http
      .get('/api/transactions')
      .set(auth(tokenBuyer))
      .expect(200);

    // Assert
    expect(res.body.map((transaction: { id: string }) => transaction.id)).toContain(
      transactionId,
    );
  });

  it('GET /transactions/:id permite participantes y rechaza usuarios ajenos', async () => {
    // Act
    const res = await http
      .get(`/api/transactions/${transactionId}`)
      .set(auth(tokenSeller))
      .expect(200);

    // Assert
    expect(res.body.id).toBe(transactionId);

    await http
      .get(`/api/transactions/${transactionId}`)
      .set(auth(tokenOther))
      .expect(403);
  });

  it('HU-16 · comprador y vendedor negocian el punto hasta quedar de acuerdo', async () => {
    const proposal = (id: string) => `/api/transactions/${id}/meeting-proposal`;
    const P1 = { safePointId: 'sp-1', scheduledTime: '2030-10-05T15:00:00.000Z' };
    const P2 = { safePointId: 'sp-2', scheduledTime: '2030-10-06T10:00:00.000Z' };

    // Validaciones de permisos y cuerpo
    await http.post(proposal(transactionId)).set(auth(tokenOther)).send(P1).expect(403);
    await http
      .post(proposal(transactionId))
      .set(auth(tokenBuyer))
      .send({ safePointId: '', scheduledTime: 'fecha-mala' })
      .expect(400);

    // El comprador propone: queda PENDING esperando al vendedor
    const proposed = await http
      .post(proposal(transactionId))
      .set(auth(tokenBuyer))
      .send(P1)
      .expect(200);
    expect(proposed.body).toMatchObject({
      status: 'PENDING',
      safePointId: 'sp-1',
      proposedById: proposed.body.buyerId,
      agreedAt: null,
    });

    // Nadie puede saltarse el acuerdo
    await http
      .post(`${proposal(transactionId)}/accept`)
      .set(auth(tokenBuyer))
      .send(P1)
      .expect(409);
    await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenBuyer))
      .send({ status: 'AGREED_POINT' })
      .expect(409);
    await http
      .post(`${proposal(transactionId)}/accept`)
      .set(auth(tokenOther))
      .send(P1)
      .expect(403);

    // El vendedor contrapropone
    const counter = await http
      .post(proposal(transactionId))
      .set(auth(tokenSeller))
      .send(P2)
      .expect(200);
    expect(counter.body).toMatchObject({
      status: 'PENDING',
      safePointId: 'sp-2',
      proposedById: counter.body.sellerId,
    });

    // El comprador no puede aceptar la propuesta vieja
    await http
      .post(`${proposal(transactionId)}/accept`)
      .set(auth(tokenBuyer))
      .send(P1)
      .expect(409);

    // Rechaza la contrapropuesta: se borra y sigue PENDING
    await http.post(`${proposal(transactionId)}/reject`).set(auth(tokenSeller)).expect(409);
    const rejected = await http
      .post(`${proposal(transactionId)}/reject`)
      .set(auth(tokenBuyer))
      .expect(200);
    expect(rejected.body).toMatchObject({
      status: 'PENDING',
      safePointId: null,
      scheduledTime: null,
      proposedById: null,
    });
    await http
      .post(`${proposal(transactionId)}/accept`)
      .set(auth(tokenBuyer))
      .send(P2)
      .expect(409);

    // El vendedor vuelve a proponer y el comprador acepta
    await http.post(proposal(transactionId)).set(auth(tokenSeller)).send(P2).expect(200);
    const agreed = await http
      .post(`${proposal(transactionId)}/accept`)
      .set(auth(tokenBuyer))
      .send(P2)
      .expect(200);
    expect(agreed.body).toMatchObject({
      id: transactionId,
      status: 'AGREED_POINT',
      safePointId: 'sp-2',
      scheduledTime: P2.scheduledTime,
    });
    expect(agreed.body.agreedAt).toEqual(expect.any(String));

    // Con el acuerdo hecho ya no se renegocia
    await http.post(proposal(transactionId)).set(auth(tokenSeller)).send(P1).expect(409);
  });

  it('PUT /transactions/:id/status valida transiciones y completa la venta', async () => {
    // Assert
    await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenBuyer))
      .send({ status: 'NO_EXISTE' })
      .expect(400);

    const res = await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenSeller))
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');

    const product = await http.get(`/api/products/${productId}`).expect(200);
    expect(product.body.status).toBe('SOLD');

    await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenSeller))
      .send({ status: 'CANCELLED' })
      .expect(409);
  });

  it('POST /transactions rechaza productos vendidos', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenOther))
      .send({ productId })
      .expect(409));

  describe('HU-15 · reserva sin condiciones de carrera', () => {
    it('si varios compradores piden el mismo producto a la vez, solo uno lo reserva', async () => {
      // Arrange
      const buyers = await Promise.all(
        [1, 2, 3, 4, 5].map((i) => newUser(`race${i}`)),
      );
      const product = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(productBody({ title: 'Producto HU-15 concurrente' }))
        .expect(201);

      // Act
      const responses = await Promise.all(
        buyers.map((token) =>
          http
            .post('/api/transactions')
            .set(auth(token))
            .send({ productId: product.body.id }),
        ),
      );

      // Assert
      const codes = responses.map((r) => r.status).sort();
      expect(codes).toEqual([201, 409, 409, 409, 409]);
      const [{ count }] = await app.get(DataSource).query(
        `SELECT COUNT(*)::int AS count FROM "transaction"
          WHERE "productId" = $1 AND "status" IN ('PENDING', 'AGREED_POINT')`,
        [product.body.id],
      );
      expect(count).toBe(1);
      const detail = await http.get(`/api/products/${product.body.id}`).expect(200);
      expect(detail.body.status).toBe('RESERVED');
    });

    it('la base de datos impide una segunda transaccion activa sobre el mismo producto', async () => {
      // Arrange
      const product = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(productBody({ title: 'Producto HU-15 índice' }))
        .expect(201);
      const tx = await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: product.body.id })
        .expect(201);
      const { buyerId, sellerId } = tx.body;

      // Act / Assert
      await expect(
        app.get(DataSource).query(
          `INSERT INTO "transaction" ("productId", "buyerId", "sellerId", "status")
           VALUES ($1, $2, $3, 'PENDING')`,
          [product.body.id, buyerId, sellerId],
        ),
      ).rejects.toThrow(/UQ_transaction_active_product/);
    });
  });

  describe('HU-16 · acordar una entrega', () => {
    it('rechaza un horario en el pasado', async () => {
      // Arrange
      const product = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(productBody({ title: 'Producto HU-16 pasado' }))
        .expect(201);
      const tx = await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: product.body.id })
        .expect(201);

      // Act / Assert
      await http
        .post(`/api/transactions/${tx.body.id}/meeting-proposal`)
        .set(auth(tokenBuyer))
        .send({ safePointId: 'cai-granada', scheduledTime: '2020-01-01T10:00:00Z' })
        .expect(400);
      const detail = await http
        .get(`/api/transactions/${tx.body.id}`)
        .set(auth(tokenBuyer))
        .expect(200);
      expect(detail.body.status).toBe('PENDING');
    });

    const reservedTx = async (title: string) => {
      const product = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(productBody({ title }))
        .expect(201);
      const tx = await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: product.body.id })
        .expect(201);
      return { productId: product.body.id as string, txId: tx.body.id as string };
    };
    const P1 = { safePointId: 'cai-granada', scheduledTime: '2099-11-10T15:00:00.000Z' };
    const P2 = { safePointId: 'cc-chipichape', scheduledTime: '2099-11-11T09:00:00.000Z' };

    it('si una parte acepta el punto y la otra cancela a la vez, el resultado es coherente', async () => {
      for (let i = 0; i < 5; i++) {
        // Arrange
        const { productId: pid, txId } = await reservedTx(`Producto HU-16 carrera ${i}`);
        await http
          .post(`/api/transactions/${txId}/meeting-proposal`)
          .set(auth(tokenSeller))
          .send(P1)
          .expect(200);

        // Act
        const [cancel, accept] = await Promise.all([
          http
            .put(`/api/transactions/${txId}/status`)
            .set(auth(tokenSeller))
            .send({ status: 'CANCELLED' }),
          http
            .post(`/api/transactions/${txId}/meeting-proposal/accept`)
            .set(auth(tokenBuyer))
            .send(P1),
        ]);

        // Assert: o quedó cancelada con el producto libre, o acordada y reservada
        const status = (
          await http.get(`/api/transactions/${txId}`).set(auth(tokenBuyer)).expect(200)
        ).body.status;
        const productStatus = (await http.get(`/api/products/${pid}`).expect(200)).body
          .status;
        expect(cancel.status).toBe(200);
        if (status === 'CANCELLED') {
          expect(productStatus).toBe('AVAILABLE');
        } else {
          expect(status).toBe('AGREED_POINT');
          expect(productStatus).toBe('RESERVED');
        }
        expect([200, 409]).toContain(accept.status);
      }
    });

    it('si el comprador acepta mientras el vendedor cambia la propuesta, nunca acepta algo que no vio', async () => {
      for (let i = 0; i < 5; i++) {
        // Arrange
        const { txId } = await reservedTx(`Producto HU-16 contrapropuesta ${i}`);
        await http
          .post(`/api/transactions/${txId}/meeting-proposal`)
          .set(auth(tokenSeller))
          .send(P1)
          .expect(200);

        // Act
        const [accept, change] = await Promise.all([
          http
            .post(`/api/transactions/${txId}/meeting-proposal/accept`)
            .set(auth(tokenBuyer))
            .send(P1),
          http
            .post(`/api/transactions/${txId}/meeting-proposal`)
            .set(auth(tokenSeller))
            .send(P2),
        ]);

        // Assert
        const tx = (
          await http.get(`/api/transactions/${txId}`).set(auth(tokenBuyer)).expect(200)
        ).body;
        if (accept.status === 200) {
          expect(change.status).toBe(409);
          expect(tx).toMatchObject({ status: 'AGREED_POINT', safePointId: P1.safePointId });
        } else {
          expect(accept.status).toBe(409);
          expect(change.status).toBe(200);
          expect(tx).toMatchObject({ status: 'PENDING', safePointId: P2.safePointId });
        }
      }
    });
  });

  describe('HU-17 · finalizar o cancelar el intercambio', () => {
    let tokenBuyer2: string;

    const newProduct = async () => {
      const res = await http
        .post('/api/products')
        .set(auth(tokenSeller))
        .send(productBody({ title: `Producto HU-17 ${Math.random()}` }))
        .expect(201);
      return res.body.id as string;
    };
    const reserve = async (id: string, token = tokenBuyer) => {
      const res = await http
        .post('/api/transactions')
        .set(auth(token))
        .send({ productId: id })
        .expect(201);
      return res.body.id as string;
    };
    /** HU-16 · El comprador propone y el vendedor acepta. */
    const agreePoint = async (txId: string) => {
      const point = { safePointId: 'sp-1', scheduledTime: '2030-10-05T15:00:00Z' };
      await http
        .post(`/api/transactions/${txId}/meeting-proposal`)
        .set(auth(tokenBuyer))
        .send(point)
        .expect(200);
      await http
        .post(`/api/transactions/${txId}/meeting-proposal/accept`)
        .set(auth(tokenSeller))
        .send(point)
        .expect(200);
    };
    const setStatus = (txId: string, status: string, token: string) =>
      http
        .put(`/api/transactions/${txId}/status`)
        .set(auth(token))
        .send({ status });
    const productStatus = async (id: string) =>
      (await http.get(`/api/products/${id}`).expect(200)).body.status;
    const txStatus = async (txId: string) =>
      (await http.get(`/api/transactions/${txId}`).set(auth(tokenSeller)).expect(200))
        .body.status;

    beforeAll(async () => {
      tokenBuyer2 = await newUser('buyer2');
    });

    it('criterio 1: el comprador completa, la transaccion queda COMPLETED y el producto SOLD', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);
      await agreePoint(tx);

      // Act
      const res = await setStatus(tx, 'COMPLETED', tokenBuyer).expect(200);

      // Assert
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.product.status).toBe('SOLD');
      expect(await productStatus(product)).toBe('SOLD');
    });

    it('criterio 2: cancelar una PENDING la deja CANCELLED y libera el producto para otro comprador', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);
      expect(await productStatus(product)).toBe('RESERVED');

      // Act
      const res = await setStatus(tx, 'CANCELLED', tokenSeller).expect(200);

      // Assert
      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.product.status).toBe('AVAILABLE');
      expect(await productStatus(product)).toBe('AVAILABLE');
      await reserve(product, tokenBuyer2);
      expect(await productStatus(product)).toBe('RESERVED');
    });

    it('criterio 2: cancelar con punto acordado tambien libera el producto', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);
      await agreePoint(tx);

      // Act
      await setStatus(tx, 'CANCELLED', tokenBuyer).expect(200);

      // Assert
      expect(await txStatus(tx)).toBe('CANCELLED');
      expect(await productStatus(product)).toBe('AVAILABLE');
    });

    it('criterio 3: solo comprador y vendedor pueden cambiar el estado', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);
      await agreePoint(tx);

      // Act / Assert
      await http
        .put(`/api/transactions/${tx}/status`)
        .send({ status: 'CANCELLED' })
        .expect(401);
      await setStatus(tx, 'CANCELLED', tokenOther).expect(403);
      await setStatus(tx, 'COMPLETED', tokenOther).expect(403);
      expect(await txStatus(tx)).toBe('AGREED_POINT');
      expect(await productStatus(product)).toBe('RESERVED');
    });

    it('repetir «cancelar» no libera el producto que otra persona reservo despues', async () => {
      // Arrange
      const product = await newProduct();
      const oldTx = await reserve(product);
      await setStatus(oldTx, 'CANCELLED', tokenBuyer).expect(200);
      await reserve(product, tokenBuyer2);

      // Act
      const res = await setStatus(oldTx, 'CANCELLED', tokenBuyer).expect(200);

      // Assert
      expect(res.body.status).toBe('CANCELLED');
      expect(await productStatus(product)).toBe('RESERVED');
    });

    it('no permite completar sin punto acordado ni reabrir una transaccion terminada', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);

      // Act / Assert
      await setStatus(tx, 'COMPLETED', tokenSeller).expect(409);
      expect(await productStatus(product)).toBe('RESERVED');
      await setStatus(tx, 'CANCELLED', tokenSeller).expect(200);
      await setStatus(tx, 'COMPLETED', tokenSeller).expect(409);
      await setStatus(tx, 'PENDING', tokenSeller).expect(409);
      expect(await productStatus(product)).toBe('AVAILABLE');
    });

    it('si comprador y vendedor responden a la vez, gana uno y el producto queda coherente', async () => {
      // Arrange
      const product = await newProduct();
      const tx = await reserve(product);
      await agreePoint(tx);

      // Act
      const [complete, cancel] = await Promise.all([
        setStatus(tx, 'COMPLETED', tokenSeller),
        setStatus(tx, 'CANCELLED', tokenBuyer),
      ]);

      // Assert
      expect([complete.status, cancel.status].sort()).toEqual([200, 409]);
      const final = await txStatus(tx);
      expect(await productStatus(product)).toBe(
        final === 'COMPLETED' ? 'SOLD' : 'AVAILABLE',
      );
    });
  });

  describe('HU-13 · retirar una publicación', () => {
    const publish = async (title: string) =>
      (
        await http
          .post('/api/products')
          .set(auth(tokenSeller))
          .send(productBody({ title }))
          .expect(201)
      ).body.id as string;
    const mine = async (token = tokenSeller) =>
      (await http.get('/api/products/mine').set(auth(token)).expect(200))
        .body as { id: string; status: string }[];
    const rowStatus = async (id: string) =>
      (
        await app
          .get(DataSource)
          .query(`SELECT "status" FROM product WHERE "id" = $1`, [id])
      )[0]?.status;

    it('criterio 1: el dueño retira su producto y el estado cambia a REMOVED', async () => {
      // Arrange
      const id = await publish('Retiro HU-13 dueño');

      // Act
      await http.delete(`/api/products/${id}`).set(auth(tokenSeller)).expect(204);

      // Assert
      expect(await rowStatus(id)).toBe('REMOVED');
      expect((await mine()).find((p) => p.id === id)?.status).toBe('REMOVED');
      await http.get(`/api/products/${id}`).expect(404);
      const feed = await http
        .get('/api/products')
        .query({ neighborhoodId: hood })
        .expect(200);
      expect(feed.body.items.map((p: { id: string }) => p.id)).not.toContain(id);
      await http.delete(`/api/products/${id}`).set(auth(tokenSeller)).expect(404);
    });

    it('criterio 2: conserva el registro y el historial (transacciones) del producto', async () => {
      // Arrange: una compra que se canceló antes de retirar el producto
      const id = await publish('Retiro HU-13 con historial');
      const tx = await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: id })
        .expect(201);
      await http
        .put(`/api/transactions/${tx.body.id}/status`)
        .set(auth(tokenBuyer))
        .send({ status: 'CANCELLED' })
        .expect(200);

      // Act
      await http.delete(`/api/products/${id}`).set(auth(tokenSeller)).expect(204);

      // Assert
      expect(await rowStatus(id)).toBe('REMOVED');
      for (const token of [tokenBuyer, tokenSeller]) {
        const detail = await http
          .get(`/api/transactions/${tx.body.id}`)
          .set(auth(token))
          .expect(200);
        expect(detail.body.status).toBe('CANCELLED');
        expect(detail.body.product).toMatchObject({ id, status: 'REMOVED' });
      }
      await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: id })
        .expect(409);
    });

    it('criterio 3: un usuario común no puede retirar productos de otros', async () => {
      // Arrange
      const id = await publish('Retiro HU-13 ajeno');

      // Act / Assert
      await http.delete(`/api/products/${id}`).expect(401);
      await http.delete(`/api/products/${id}`).set(auth(tokenBuyer)).expect(403);
      await http.delete(`/api/products/${id}`).set(auth(tokenOther)).expect(403);
      expect(await rowStatus(id)).toBe('AVAILABLE');
      expect((await mine(tokenBuyer)).map((p) => p.id)).not.toContain(id);
    });

    it('no retira un producto reservado: primero hay que cancelar la transacción', async () => {
      // Arrange
      const id = await publish('Retiro HU-13 reservado');
      const tx = await http
        .post('/api/transactions')
        .set(auth(tokenBuyer))
        .send({ productId: id })
        .expect(201);

      // Act / Assert
      const res = await http
        .delete(`/api/products/${id}`)
        .set(auth(tokenSeller))
        .expect(409);
      expect(res.body.message).toMatch(/cancela la transacción/);
      await http
        .put(`/api/transactions/${tx.body.id}/status`)
        .set(auth(tokenSeller))
        .send({ status: 'CANCELLED' })
        .expect(200);
      await http.delete(`/api/products/${id}`).set(auth(tokenSeller)).expect(204);
    });

    it('si se retira y se reserva al mismo tiempo, el producto queda coherente', async () => {
      for (let i = 0; i < 5; i++) {
        // Arrange
        const id = await publish(`Retiro HU-13 carrera ${i}`);

        // Act
        const [removal, reserve] = await Promise.all([
          http.delete(`/api/products/${id}`).set(auth(tokenSeller)),
          http.post('/api/transactions').set(auth(tokenBuyer)).send({ productId: id }),
        ]);

        // Assert: o se retiró y no hay reserva, o se reservó y no se retiró
        const status = await rowStatus(id);
        if (removal.status === 204) {
          expect(reserve.status).toBeGreaterThanOrEqual(400);
          expect(status).toBe('REMOVED');
        } else {
          expect(removal.status).toBe(409);
          expect(reserve.status).toBe(201);
          expect(status).toBe('RESERVED');
          await http
            .put(`/api/transactions/${reserve.body.id}/status`)
            .set(auth(tokenBuyer))
            .send({ status: 'CANCELLED' })
            .expect(200);
        }
      }
    });

    it('GET /products/mine exige autenticación', async () => {
      await http.get('/api/products/mine').expect(401);
    });
  });
});
