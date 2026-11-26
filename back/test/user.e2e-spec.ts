
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

const run = Date.now().toString();
const emailPrefix = `e2e-${run}-`;
const password = 'Passw0rd1';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let dataSource: DataSource;

  let token: string;
  let userId: string;
  let userEmail: string;

  const auth = (jwt: string) => ({
    Authorization: `Bearer ${jwt}`,
  });

  const newUser = (suffix: string) => ({
    email: `${emailPrefix}${suffix}@test.com`,
    password,
    fullName: `E2E User ${suffix}`,
  });

  beforeAll(async () => {
    process.env.FEED_CACHE_TTL_SECONDS = '0';

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
    dataSource = app.get(DataSource);

    // Usuario base para las pruebas de perfil y autenticación.
    const user = newUser('base');

    const registerResponse = await http
      .post('/api/user/register')
      .send(user)
      .expect(201);

    userId = registerResponse.body.id;
    userEmail = user.email;
    token = registerResponse.body.token;

    expect(userId).toBeDefined();
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      // Elimina solamente los usuarios creados por este archivo.
      await dataSource.query(
        'DELETE FROM "user" WHERE email LIKE $1',
        [`${emailPrefix}%`],
      );

      await app.close();
    }
  });

  it('POST /user/register registra un usuario', async () => {
    const user = newUser('register');

    const res = await http
      .post('/api/user/register')
      .send(user)
      .expect(201);

    expect(res.body).toMatchObject({
      email: user.email,
      fullName: user.fullName,
    });

    expect(res.body.id).toBeDefined();
    expect(res.body.token).toBeDefined();

    // La contraseña nunca debe devolverse en la respuesta.
    expect(res.body.password).toBeUndefined();
  });

  it('POST /user/register rechaza un correo duplicado', async () => {
    await http
      .post('/api/user/register')
      .send(newUser('base'))
      .expect(409);
  });

  it('POST /user/register valida los datos recibidos', async () => {
    await http
      .post('/api/user/register')
      .send({
        email: 'correo-invalido',
        password: '123',
        fullName: 'Usuario inválido',
        extra: true,
      })
      .expect(400);
  });

  describe('HU-01 · Crear una cuenta', () => {
    it('crea un USER activo y entrega un JWT válido', async () => {
      const user = newUser('hu01-ok');

      const res = await http.post('/api/user/register').send(user).expect(201);

      expect(res.body).toMatchObject({
        email: user.email,
        fullName: user.fullName,
        role: ['USER'],
        isActive: true,
        verificationStatus: 'UNVERIFIED',
      });
      expect(typeof res.body.token).toBe('string');
      expect(res.body.password).toBeUndefined();
      expect(res.body.tokenVersion).toBeUndefined();

      // El JWT entregado sirve para acceder a rutas protegidas.
      const me = await http
        .get('/api/user/me')
        .set(auth(res.body.token))
        .expect(200);
      expect(me.body.id).toBe(res.body.id);
    });

    it('devuelve 409 si el correo ya existe, sin importar mayúsculas, y no duplica la cuenta', async () => {
      const user = newUser('hu01-dup');
      await http.post('/api/user/register').send(user).expect(201);

      await http
        .post('/api/user/register')
        .send({ ...user, email: `  ${user.email.toUpperCase()} ` })
        .expect(409);

      const [{ count }] = await dataSource.query(
        'SELECT COUNT(*)::int AS count FROM "user" WHERE email = $1',
        [user.email],
      );
      expect(count).toBe(1);
    });

    it.each([
      ['role', { role: ['ADMIN'] }],
      ['isActive', { isActive: false }],
      ['verificationStatus', { verificationStatus: 'VERIFIED' }],
    ])('devuelve 400 si intenta asignar %s y no crea la cuenta', async (field, extra) => {
      const user = newUser(`hu01-${field.toLowerCase()}`);

      await http
        .post('/api/user/register')
        .send({ ...user, ...extra })
        .expect(400);

      const [{ count }] = await dataSource.query(
        'SELECT COUNT(*)::int AS count FROM "user" WHERE email = $1',
        [user.email],
      );
      expect(count).toBe(0);
    });

    it('devuelve 400 con un nombre vacío', async () => {
      await http
        .post('/api/user/register')
        .send({ ...newUser('hu01-noname'), fullName: '   ' })
        .expect(400);
    });
  });

  it('POST /user/login inicia sesión con credenciales válidas', async () => {
    const res = await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: userEmail,
    });

    expect(res.body.token).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it('POST /user/login rechaza una contraseña incorrecta', async () => {
    await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password: 'WrongPass1',
      })
      .expect(401);
  });

  describe('HU-02 · Iniciar sesión', () => {
    const decode = (jwt: string) =>
      JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) as {
        iat: number;
        exp: number;
      };

    it('criterio 1: con credenciales correctas entrega un JWT de 1 hora', async () => {
      const res = await http
        .post('/api/user/login')
        .send({ email: userEmail, password })
        .expect(200);

      const { iat, exp } = decode(res.body.token);
      expect(exp - iat).toBe(3600);
    });

    it('criterio 2: correo inexistente, contraseña errónea o cuenta inactiva devuelven 401', async () => {
      const user = newUser('hu02-inactiva');
      await http.post('/api/user/register').send(user).expect(201);
      await dataSource.query('UPDATE "user" SET "isActive" = false WHERE email = $1', [
        user.email,
      ]);

      await http
        .post('/api/user/login')
        .send({ email: `${emailPrefix}no-existe@trendy.test`, password })
        .expect(401);
      await http
        .post('/api/user/login')
        .send({ email: userEmail, password: 'Incorrecta1' })
        .expect(401);
      await http
        .post('/api/user/login')
        .send({ email: user.email, password })
        .expect(401);
    });

    it('criterio 3: sin JWT, con JWT inválido o vencido, la ruta protegida devuelve 401', async () => {
      const expired = app
        .get(JwtService)
        .sign({ id: userId, email: userEmail, tokenVersion: 0 }, { expiresIn: '1s' });
      await new Promise((resolve) => setTimeout(resolve, 2100));

      await http.get('/api/user/me').expect(401);
      await http.get('/api/user/me').set(auth('no.es.un.jwt')).expect(401);
      await http.get('/api/user/me').set(auth(expired)).expect(401);
    });
  });

  it('GET /user/me requiere autenticación', async () => {
    await http.get('/api/user/me').expect(401);
  });

  it('GET /user/me devuelve el perfil autenticado sin exponer la contraseña', async () => {
    const res = await http
      .get('/api/user/me')
      .set(auth(token))
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: userEmail,
      fullName: 'E2E User base',
      isActive: true,
    });

    expect(res.body.password).toBeUndefined();
  });

  it('PATCH /user/me actualiza el nombre del usuario', async () => {
    const res = await http
      .patch('/api/user/me')
      .set(auth(token))
      .send({
        fullName: 'E2E User Updated',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      fullName: 'E2E User Updated',
    });
  });

  it('TRD-25 · PATCH /user/me guarda el avatar de objeto y una foto subida', async () => {
    const res = await http
      .patch('/api/user/me')
      .set(auth(token))
      .send({ avatar: 'guitarra:#BFD7E6', photoUrl: 'data:image/webp;base64,UklGRg==' })
      .expect(200);
    expect(res.body).toMatchObject({ avatar: 'guitarra:#BFD7E6', photoUrl: 'data:image/webp;base64,UklGRg==' });

    const pub = await http.get(`/api/user/${userId}`).set(auth(token)).expect(200);
    expect(pub.body.avatar).toBe('guitarra:#BFD7E6');

    await http.patch('/api/user/me').set(auth(token)).send({ avatar: 'cohete:#F77F00' }).expect(400);
    await http.patch('/api/user/me').set(auth(token)).send({ photoUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }).expect(400);

    const cleared = await http.patch('/api/user/me').set(auth(token)).send({ avatar: null, photoUrl: null }).expect(200);
    expect(cleared.body).toMatchObject({ avatar: null, photoUrl: null });
  });

  it('PATCH /user/me valida los datos de actualización', async () => {
    await http
      .patch('/api/user/me')
      .set(auth(token))
      .send({
        extra: 'campo no permitido',
      })
      .expect(400);
  });

  describe('HU-04 · Actualizar mi perfil', () => {
    it('guarda los datos permitidos y devuelve la información nueva', async () => {
      const { body: registered } = await http
        .post('/api/user/register')
        .send(newUser('hu04-edit'))
        .expect(201);
      const editToken: string = registered.token;

      const res = await http
        .patch('/api/user/me')
        .set(auth(editToken))
        .send({ fullName: '  E2E Perfil Nuevo  ', info: '  Vendo ropa de segunda mano.  ' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: registered.id,
        fullName: 'E2E Perfil Nuevo',
        info: 'Vendo ropa de segunda mano.',
      });

      const me = await http.get('/api/user/me').set(auth(editToken)).expect(200);
      expect(me.body).toMatchObject({
        fullName: 'E2E Perfil Nuevo',
        info: 'Vendo ropa de segunda mano.',
      });
    });

    it.each([
      ['un campo no admitido', { email: 'otro@test.com' }],
      ['un campo protegido', { verificationStatus: 'VERIFIED' }],
      ['un nombre demasiado corto', { fullName: 'A' }],
      ['un nombre demasiado largo', { fullName: 'A'.repeat(101) }],
      ['un nombre que no es texto', { fullName: 123 }],
      ['un nombre nulo', { fullName: null }],
      ['una información de más de 300 caracteres', { info: 'x'.repeat(301) }],
    ])('rechaza con 400 %s', async (_caso, body) => {
      await http.patch('/api/user/me').set(auth(token)).send(body).expect(400);
    });

    it('con la verificación PENDING o VERIFIED no permite cambiar el nombre', async () => {
      const user = newUser('hu04-lock');
      const { body } = await http.post('/api/user/register').send(user).expect(201);
      const lockedToken: string = body.token;

      await http
        .post('/api/user/me/verification')
        .set(auth(lockedToken))
        .expect(200);

      await http
        .patch('/api/user/me')
        .set(auth(lockedToken))
        .send({ fullName: 'Nombre Distinto' })
        .expect(403);

      // Los demás datos permitidos sí se pueden cambiar.
      const pending = await http
        .patch('/api/user/me')
        .set(auth(lockedToken))
        .send({ fullName: user.fullName, info: 'Sigo en revisión' })
        .expect(200);
      expect(pending.body).toMatchObject({
        fullName: user.fullName,
        info: 'Sigo en revisión',
        verificationStatus: 'PENDING',
      });

      await dataSource.query(
        'UPDATE "user" SET "verificationStatus" = $1 WHERE id = $2',
        ['VERIFIED', body.id],
      );

      await http
        .patch('/api/user/me')
        .set(auth(lockedToken))
        .send({ fullName: 'Otro Nombre' })
        .expect(403);

      const me = await http.get('/api/user/me').set(auth(lockedToken)).expect(200);
      expect(me.body.fullName).toBe(user.fullName);
    });
  });

  describe('HU-06 · Solicitar verificación', () => {
    const register = async (suffix: string) => {
      const user = newUser(`hu06-${suffix}`);
      const { body } = await http.post('/api/user/register').send(user).expect(201);
      return { id: body.id as string, token: body.token as string, user };
    };

    it('UNVERIFIED pasa a PENDING y la respuesta solo incluye el estado', async () => {
      const account = await register('unverified');
      const response = await http
        .post('/api/user/me/verification')
        .set(auth(account.token))
        .expect(200);

      expect(response.body).toEqual({ verificationStatus: 'PENDING' });
      expect(response.body.password).toBeUndefined();
      expect(
        (await http.get('/api/user/me').set(auth(account.token)).expect(200)).body
          .verificationStatus,
      ).toBe('PENDING');
    });

    it('permite reenvío desde REJECTED', async () => {
      const account = await register('rejected');
      await dataSource.query(
        'UPDATE "user" SET "verificationStatus" = $1 WHERE id = $2',
        ['REJECTED', account.id],
      );

      await http
        .post('/api/user/me/verification')
        .set(auth(account.token))
        .expect(200, { verificationStatus: 'PENDING' });
    });

    it.each(['PENDING', 'VERIFIED'])(
      'rechaza una solicitud duplicada cuando el estado es %s',
      async (status) => {
        const account = await register(`blocked-${status.toLowerCase()}`);
        await dataSource.query(
          'UPDATE "user" SET "verificationStatus" = $1 WHERE id = $2',
          [status, account.id],
        );

        await http
          .post('/api/user/me/verification')
          .set(auth(account.token))
          .expect(409);
        const persisted = await dataSource.query(
          'SELECT "verificationStatus" FROM "user" WHERE id = $1',
          [account.id],
        );
        expect(persisted[0].verificationStatus).toBe(status);
      },
    );

    it('requiere JWT válido y no acepta identidad desde el cuerpo', async () => {
      const account = await register('auth');
      const otherAccount = await register('auth-target');
      await http.post('/api/user/me/verification').expect(401);
      await http
        .post('/api/user/me/verification')
        .set(auth('invalid.jwt.token'))
        .expect(401);
      const expiredToken = app
        .get(JwtService)
        .sign({ id: account.id, tokenVersion: 0 }, { expiresIn: -1 });
      await http
        .post('/api/user/me/verification')
        .set(auth(expiredToken))
        .expect(401);
      await http
        .post('/api/user/me/verification')
        .set(auth(account.token))
        .send({ userId: otherAccount.id })
        .expect(200, { verificationStatus: 'PENDING' });

      const otherStatus = await dataSource.query(
        'SELECT "verificationStatus" FROM "user" WHERE id = $1',
        [otherAccount.id],
      );
      expect(otherStatus[0].verificationStatus).toBe('UNVERIFIED');
      const ownerStatus = await dataSource.query(
        'SELECT "verificationStatus" FROM "user" WHERE id = $1',
        [account.id],
      );
      expect(ownerStatus[0].verificationStatus).toBe('PENDING');
    });

    it('dos solicitudes simultáneas producen solo una transición exitosa', async () => {
      const account = await register('concurrent');
      const results = await Promise.all([
        http.post('/api/user/me/verification').set(auth(account.token)),
        http.post('/api/user/me/verification').set(auth(account.token)),
      ]);

      expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
      const persisted = await dataSource.query(
        'SELECT "verificationStatus" FROM "user" WHERE id = $1',
        [account.id],
      );
      expect(persisted[0].verificationStatus).toBe('PENDING');
    });

    it.each(['UNVERIFIED', 'REJECTED'])(
      'permite cambiar el nombre con estado %s',
      async (status) => {
        const account = await register(`name-${status.toLowerCase()}`);
        if (status === 'REJECTED') {
          await dataSource.query(
            'UPDATE "user" SET "verificationStatus" = $1 WHERE id = $2',
            [status, account.id],
          );
        }

        await http
          .patch('/api/user/me')
          .set(auth(account.token))
          .send({ fullName: 'Nombre actualizado HU06' })
          .expect(200);
      },
    );
  });

  describe('HU-03 · Consultar mi perfil', () => {
    it('incluye nombre, correo, foto, verificación y reputación, sin la contraseña', async () => {
      const res = await http.get('/api/user/me').set(auth(token)).expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          fullName: expect.any(String),
          email: userEmail,
          photoUrl: null,
          verificationStatus: 'UNVERIFIED',
          ratingAverage: expect.any(Number),
          reviewsCount: expect.any(Number),
        }),
      );
      expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);
    });

    it('la foto se puede definir y quitar, y se refleja en el perfil', async () => {
      const url = 'https://images.example.com/fotos/perfil.jpg';
      await http.patch('/api/user/me').set(auth(token)).send({ photoUrl: url }).expect(200);
      expect((await http.get('/api/user/me').set(auth(token)).expect(200)).body.photoUrl).toBe(url);
      expect((await http.get(`/api/user/${userId}`).set(auth(token)).expect(200)).body.photoUrl).toBe(url);

      await http.patch('/api/user/me').set(auth(token)).send({ photoUrl: null }).expect(200);
      expect((await http.get('/api/user/me').set(auth(token)).expect(200)).body.photoUrl).toBeNull();
    });

    it('rechaza una foto que no es una URL http(s)', async () => {
      await http
        .patch('/api/user/me')
        .set(auth(token))
        .send({ photoUrl: 'javascript:alert(1)' })
        .expect(400);
    });
  });

  it('PATCH /user/me/password cambia la contraseña con la actual correcta', async () => {
    const newPassword = 'NewPassw2';

    const res = await http
      .patch('/api/user/me/password')
      .set(auth(token))
      .send({
        currentPassword: password,
        newPassword,
      })
      .expect(200);

    expect(res.body.message).toBe('Password updated successfully');

    // Comprueba que la nueva contraseña funciona.
    await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password: newPassword,
      })
      .expect(200);
  });

  it('PATCH /user/me/password rechaza una contraseña actual incorrecta', async () => {
    await http
      .patch('/api/user/me/password')
      .set(auth(token))
      .send({
        currentPassword: 'WrongPass1',
        newPassword: 'AnotherPass2',
      })
      .expect(403);
  });

  it('PATCH /user/me/email cambia el correo con la contraseña correcta', async () => {
    const newEmail = `${emailPrefix}changed@test.com`;

    const res = await http
      .patch('/api/user/me/email')
      .set(auth(token))
      .send({
        currentPassword: 'NewPassw2',
        newEmail,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: newEmail,
    });

    // Verifica que el correo nuevo permite iniciar sesión.
    await http
      .post('/api/user/login')
      .send({
        email: newEmail,
        password: 'NewPassw2',
      })
      .expect(200);
  });

  describe('HU-07 · Consultar otro perfil', () => {
    it('criterio 1: sin sesión responde 401; con sesión válida devuelve el perfil', async () => {
      await http.get(`/api/user/${userId}`).expect(401);
      await http
        .get(`/api/user/${userId}`)
        .set(auth('token-invalido'))
        .expect(401);

      const res = await http
        .get(`/api/user/${userId}`)
        .set(auth(token))
        .expect(200);
      expect(res.body).toMatchObject({
        id: userId,
        fullName: 'E2E User Updated',
      });
    });

    it('criterio 2: presenta ratingAverage y reviewsCount como números', async () => {
      const res = await http
        .get(`/api/user/${userId}`)
        .set(auth(token))
        .expect(200);

      expect(res.body.ratingAverage).toBe(0);
      expect(res.body.reviewsCount).toBe(0);
      expect(res.body.recentReviews).toEqual([]);
      expect(typeof res.body.availableProductsCount).toBe('number');
      expect(res.body.memberSince).toEqual(expect.any(String));
    });

    it('criterio 3: no expone contraseña, correo, rol ni datos de autenticación', async () => {
      const res = await http
        .get(`/api/user/${userId}`)
        .set(auth(token))
        .expect(200);

      for (const field of [
        'password',
        'email',
        'role',
        'isActive',
        'tokenVersion',
        'token',
      ]) {
        expect(res.body).not.toHaveProperty(field);
      }
      expect(JSON.stringify(res.body)).not.toContain('@test.com');
    });
  });

  it('GET /user/:id valida el UUID', async () => {
    await http
      .get('/api/user/no-es-uuid')
      .set(auth(token))
      .expect(400);
  });

  it('GET /user/:id devuelve 404 para un usuario inexistente', async () => {
    await http
      .get('/api/user/00000000-0000-4000-8000-000000000000')
      .set(auth(token))
      .expect(404);
  });

  describe('POST /user/logout', () => {
    it('requiere autenticación', async () => {
      await http.post('/api/user/logout').expect(401);
    });

    it('invalida el token y exige un nuevo inicio de sesión', async () => {
      const user = newUser('logout');

      const registerRes = await http
        .post('/api/user/register')
        .send(user)
        .expect(201);

      const oldToken: string = registerRes.body.token;

      await http.get('/api/user/me').set(auth(oldToken)).expect(200);

      const logoutRes = await http
        .post('/api/user/logout')
        .set(auth(oldToken))
        .expect(200);

      expect(logoutRes.body.message).toBe('Session successfuly closed');

      await http.get('/api/user/me').set(auth(oldToken)).expect(401);
      await http.post('/api/user/logout').set(auth(oldToken)).expect(401);

      const loginRes = await http
        .post('/api/user/login')
        .send({ email: user.email, password })
        .expect(200);

      const newToken: string = loginRes.body.token;

      await http.get('/api/user/me').set(auth(newToken)).expect(200);

      await http.get('/api/user/me').set(auth(oldToken)).expect(401);
    });
  });


  describe('HU-05 · Actualizar mis credenciales', () => {
    // Cada prueba usa su propia cuenta para no alterar al usuario compartido.
    const register = async (suffix: string) => {
      const user = newUser(suffix);
      const res = await http.post('/api/user/register').send(user).expect(201);
      return { ...user, token: res.body.token as string };
    };
    const canLogin = (email: string, pass: string) =>
      http.post('/api/user/login').send({ email, password: pass });

    it('criterio 1: sin la contraseña actual no se cambia ni el correo ni la contraseña (400)', async () => {
      const user = await register('hu05-c1');

      await http
        .patch('/api/user/me/password')
        .set(auth(user.token))
        .send({ newPassword: 'Another99' })
        .expect(400);
      await http
        .patch('/api/user/me/email')
        .set(auth(user.token))
        .send({ newEmail: `${emailPrefix}hu05-c1-new@test.com` })
        .expect(400);

      // Nada cambió: la cuenta sigue entrando con sus datos originales.
      await canLogin(user.email, user.password).expect(200);
    });

    it('criterio 1: con la contraseña actual correcta se cambian ambos datos', async () => {
      const user = await register('hu05-c1ok');
      const newEmail = `${emailPrefix}hu05-c1ok-new@test.com`;

      await http
        .patch('/api/user/me/password')
        .set(auth(user.token))
        .send({ currentPassword: user.password, newPassword: 'Another99' })
        .expect(200);
      await http
        .patch('/api/user/me/email')
        .set(auth(user.token))
        .send({ currentPassword: 'Another99', newEmail })
        .expect(200);

      await canLogin(newEmail, 'Another99').expect(200);
      await canLogin(user.email, user.password).expect(401);
    });

    it('criterio 2: con la contraseña actual incorrecta ambos cambios responden 403 y no se aplican', async () => {
      const user = await register('hu05-c2');
      const newEmail = `${emailPrefix}hu05-c2-new@test.com`;

      await http
        .patch('/api/user/me/password')
        .set(auth(user.token))
        .send({ currentPassword: 'WrongPass1', newPassword: 'Another99' })
        .expect(403);
      await http
        .patch('/api/user/me/email')
        .set(auth(user.token))
        .send({ currentPassword: 'WrongPass1', newEmail })
        .expect(403);

      // Sigue entrando con el correo y la contraseña originales.
      await canLogin(user.email, user.password).expect(200);
      await canLogin(newEmail, user.password).expect(401);
      await canLogin(user.email, 'Another99').expect(401);
    });

    it('criterio 2: sin sesión responde 401', async () => {
      await http
        .patch('/api/user/me/password')
        .send({ currentPassword: password, newPassword: 'Another99' })
        .expect(401);
      await http
        .patch('/api/user/me/email')
        .send({ currentPassword: password, newEmail: 'x@test.com' })
        .expect(401);
    });

    it('criterio 3: la contraseña nueva debe ser distinta a la actual (400)', async () => {
      const user = await register('hu05-c3same');

      await http
        .patch('/api/user/me/password')
        .set(auth(user.token))
        .send({ currentPassword: user.password, newPassword: user.password })
        .expect(400);

      await canLogin(user.email, user.password).expect(200);
    });

    it('criterio 3: la contraseña nueva debe tener entre 8 y 12 caracteres', async () => {
      const user = await register('hu05-c3len');
      const change = (currentPassword: string, newPassword: string) =>
        http
          .patch('/api/user/me/password')
          .set(auth(user.token))
          .send({ currentPassword, newPassword });

      await change(user.password, 'Abcde12').expect(400); // 7: muy corta
      await change(user.password, 'Abcdefgh12345').expect(400); // 13: muy larga

      await change(user.password, 'Abcdef12').expect(200); // 8: mínimo válido
      await change('Abcdef12', 'Abcdefghi123').expect(200); // 12: máximo válido
      await canLogin(user.email, 'Abcdefghi123').expect(200);
    });

    it('un correo ya registrado por otra cuenta responde 409 y no cambia el actual', async () => {
      const first = await register('hu05-dup-a');
      const second = await register('hu05-dup-b');

      await http
        .patch('/api/user/me/email')
        .set(auth(second.token))
        .send({ currentPassword: second.password, newEmail: first.email })
        .expect(409);

      await canLogin(second.email, second.password).expect(200);
    });
  });

  describe('HU-20 · Administrar usuarios', () => {
    const register = async (suffix: string) => {
      const user = newUser(`hu20-${suffix}`);
      const { body } = await http.post('/api/user/register').send(user).expect(201);
      return { id: body.id as string, token: body.token as string, user };
    };

    /** Crea una cuenta, le da el rol indicado y vuelve a iniciar sesión. */
    const registerWithRole = async (suffix: string, role: 'ADMIN' | 'MODERATOR') => {
      const account = await register(suffix);
      await dataSource.query(
        `UPDATE "user" SET "role" = ARRAY[$1]::"public"."user_role_enum"[] WHERE id = $2`,
        [role, account.id],
      );
      const { body } = await http
        .post('/api/user/login')
        .send({ email: account.user.email, password })
        .expect(200);
      return { ...account, token: body.token as string };
    };

    let admin: Awaited<ReturnType<typeof registerWithRole>>;

    beforeAll(async () => {
      admin = await registerWithRole('admin', 'ADMIN');
    });

    it('criterio 1: solo ADMIN cambia roles y activa o desactiva cuentas', async () => {
      const target = await register('c1-target');
      const user = await register('c1-user');
      const moderator = await registerWithRole('c1-mod', 'MODERATOR');

      for (const actor of [user, moderator]) {
        await http
          .patch(`/api/admin/users/${target.id}/role`)
          .set(auth(actor.token))
          .send({ roles: ['MODERATOR'] })
          .expect(403);
        await http
          .patch(`/api/admin/users/${target.id}/active`)
          .set(auth(actor.token))
          .send({ isActive: false })
          .expect(403);
      }
      await http
        .patch(`/api/admin/users/${target.id}/role`)
        .send({ roles: ['MODERATOR'] })
        .expect(401);

      const roles = await http
        .patch(`/api/admin/users/${target.id}/role`)
        .set(auth(admin.token))
        .send({ roles: ['USER', 'MODERATOR'] })
        .expect(200);
      expect(roles.body.role).toEqual(['USER', 'MODERATOR']);

      const inactive = await http
        .patch(`/api/admin/users/${target.id}/active`)
        .set(auth(admin.token))
        .send({ isActive: false })
        .expect(200);
      expect(inactive.body.isActive).toBe(false);

      const active = await http
        .patch(`/api/admin/users/${target.id}/active`)
        .set(auth(admin.token))
        .send({ isActive: true })
        .expect(200);
      expect(active.body.isActive).toBe(true);
    });

    it('criterio 1: rechaza roles vacíos, inválidos o duplicados', async () => {
      const target = await register('c1-invalid');
      for (const roles of [[], ['SUPERADMIN'], ['USER', 'USER']]) {
        await http
          .patch(`/api/admin/users/${target.id}/role`)
          .set(auth(admin.token))
          .send({ roles })
          .expect(400);
      }
    });

    it('criterio 2: desactivar conserva los datos e invalida los JWT vigentes, también al reactivar', async () => {
      const target = await register('c2-target');
      await http.get('/api/user/me').set(auth(target.token)).expect(200);

      await http
        .patch(`/api/admin/users/${target.id}/active`)
        .set(auth(admin.token))
        .send({ isActive: false })
        .expect(200);

      // El JWT que tenía ya no sirve y tampoco puede iniciar sesión.
      await http.get('/api/user/me').set(auth(target.token)).expect(401);
      await http
        .post('/api/user/login')
        .send({ email: target.user.email, password })
        .expect(401);

      // Los datos se conservan: el admin la sigue viendo con su información.
      const kept = await http
        .get(`/api/admin/users/${target.id}`)
        .set(auth(admin.token))
        .expect(200);
      expect(kept.body).toMatchObject({
        id: target.id,
        email: target.user.email,
        fullName: target.user.fullName,
        isActive: false,
      });

      // Al reactivarla, el token viejo sigue invalidado; un login nuevo sí sirve.
      await http
        .patch(`/api/admin/users/${target.id}/active`)
        .set(auth(admin.token))
        .send({ isActive: true })
        .expect(200);
      await http.get('/api/user/me').set(auth(target.token)).expect(401);
      const login = await http
        .post('/api/user/login')
        .send({ email: target.user.email, password })
        .expect(200);
      await http.get('/api/user/me').set(auth(login.body.token)).expect(200);
    });

    it('criterio 3: el admin no puede quitarse ADMIN ni desactivar su propia cuenta', async () => {
      await http
        .patch(`/api/admin/users/${admin.id}/role`)
        .set(auth(admin.token))
        .send({ roles: ['USER'] })
        .expect(403);
      await http
        .patch(`/api/admin/users/${admin.id}/active`)
        .set(auth(admin.token))
        .send({ isActive: false })
        .expect(403);
      await http
        .delete(`/api/admin/users/${admin.id}`)
        .set(auth(admin.token))
        .expect(403);

      // Sigue siendo ADMIN, activo y con su sesión vigente.
      const me = await http.get('/api/user/me').set(auth(admin.token)).expect(200);
      expect(me.body.role).toContain('ADMIN');
      expect(me.body.isActive).toBe(true);
    });
  });

  describe('HU-19 · Resolver verificaciones', () => {
    type Account = { id: string; token: string; user: ReturnType<typeof newUser> };

    const register = async (suffix: string): Promise<Account> => {
      const user = newUser(`hu19-${suffix}`);
      const { body } = await http.post('/api/user/register').send(user).expect(201);
      return { id: body.id as string, token: body.token as string, user };
    };

    /** Crea una cuenta, le da el rol indicado y vuelve a iniciar sesión. */
    const registerWithRole = async (
      suffix: string,
      role: 'ADMIN' | 'MODERATOR',
    ): Promise<Account> => {
      const account = await register(suffix);
      await dataSource.query(
        `UPDATE "user" SET "role" = ARRAY[$1]::"public"."user_role_enum"[] WHERE id = $2`,
        [role, account.id],
      );
      const { body } = await http
        .post('/api/user/login')
        .send({ email: account.user.email, password })
        .expect(200);
      return { ...account, token: body.token as string };
    };

    /** Registra una cuenta y deja su solicitud de verificación en PENDING. */
    const registerPending = async (suffix: string): Promise<Account> => {
      const account = await register(suffix);
      await http
        .post('/api/user/me/verification')
        .set(auth(account.token))
        .expect(200);
      return account;
    };

    const statusOf = async (id: string) =>
      (
        await dataSource.query(
          'SELECT "verificationStatus" FROM "user" WHERE id = $1',
          [id],
        )
      )[0].verificationStatus as string;

    /** Recorre todas las páginas de pendientes para no depender de otros datos. */
    const listPending = async (jwt: string) => {
      const all: any[] = [];
      let skip = 0;
      let total = 0;
      do {
        const { body } = await http
          .get(`/api/moderation/verifications?limit=100&skip=${skip}`)
          .set(auth(jwt))
          .expect(200);
        all.push(...body.data);
        total = body.total;
        skip += 100;
      } while (skip < total);
      return all;
    };

    let moderator: Account;
    let admin: Account;

    beforeAll(async () => {
      moderator = await registerWithRole('mod', 'MODERATOR');
      admin = await registerWithRole('admin', 'ADMIN');
    });

    it('criterio 1: moderador y administrador ven solo las solicitudes PENDING, las más antiguas primero', async () => {
      const first = await registerPending('c1-first');
      const second = await registerPending('c1-second');
      const unverified = await register('c1-unverified');
      const verified = await register('c1-verified');
      await dataSource.query(
        'UPDATE "user" SET "verificationStatus" = $1 WHERE id = $2',
        ['VERIFIED', verified.id],
      );

      for (const actor of [moderator, admin]) {
        const pending = await listPending(actor.token);
        const ids = pending.map((u) => u.id);

        expect(ids).toEqual(expect.arrayContaining([first.id, second.id]));
        expect(ids).not.toContain(unverified.id);
        expect(ids).not.toContain(verified.id);
        expect(pending.every((u) => u.verificationStatus === 'PENDING')).toBe(true);
        expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
        // Nunca se expone la contraseña.
        expect(pending.some((u) => 'password' in u)).toBe(false);
      }
    });

    it('criterio 1: cada solicitud trae foto, información y la fecha real en que se pidió', async () => {
      const target = await register('c1-detail');
      const photoUrl = 'https://images.example.com/hu19.jpg';
      await dataSource.query(
        'UPDATE "user" SET "photoUrl" = $1, "info" = $2 WHERE id = $3',
        [photoUrl, 'Vendo ropa en San Fernando', target.id],
      );
      const before = Date.now();
      await http
        .post('/api/user/me/verification')
        .set(auth(target.token))
        .expect(200);

      const item = (await listPending(moderator.token)).find(
        (u) => u.id === target.id,
      );
      expect(item).toMatchObject({
        photoUrl,
        info: 'Vendo ropa en San Fernando',
        verificationStatus: 'PENDING',
      });
      const requestedAt = new Date(item.verificationRequestedAt).getTime();
      expect(requestedAt).toBeGreaterThanOrEqual(before - 1000);
      expect(requestedAt).toBeLessThanOrEqual(Date.now() + 1000);

      // Editar el perfil no cambia la fecha de la solicitud.
      await http
        .patch('/api/user/me')
        .set(auth(target.token))
        .send({ info: 'Texto nuevo' })
        .expect(200);
      const after = (await listPending(moderator.token)).find(
        (u) => u.id === target.id,
      );
      expect(after.verificationRequestedAt).toBe(item.verificationRequestedAt);
    });

    it('criterio 1: pagina con limit y skip y valida los parámetros', async () => {
      await registerPending('c1-page-a');
      await registerPending('c1-page-b');

      const page = await http
        .get('/api/moderation/verifications?limit=1&skip=0')
        .set(auth(moderator.token))
        .expect(200);
      expect(page.body.data).toHaveLength(1);
      expect(page.body).toMatchObject({ limit: 1, skip: 0 });
      expect(page.body.total).toBeGreaterThanOrEqual(2);

      for (const query of ['limit=0', 'limit=101', 'limit=abc', 'skip=-1']) {
        await http
          .get(`/api/moderation/verifications?${query}`)
          .set(auth(moderator.token))
          .expect(400);
      }
    });

    it('criterio 1: un usuario común no puede consultar y sin token responde 401', async () => {
      const user = await register('c1-user');

      await http
        .get('/api/moderation/verifications')
        .set(auth(user.token))
        .expect(403);
      await http.get('/api/moderation/verifications').expect(401);
    });

    it('criterio 2: aprobar deja la cuenta VERIFIED y sale de la lista de pendientes', async () => {
      const target = await registerPending('c2-approve');

      const res = await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .set(auth(moderator.token))
        .send({ approved: true })
        .expect(200);

      expect(res.body).toMatchObject({
        id: target.id,
        verificationStatus: 'VERIFIED',
      });
      expect(res.body.password).toBeUndefined();
      expect(
        (await http.get('/api/user/me').set(auth(target.token)).expect(200))
          .body.verificationStatus,
      ).toBe('VERIFIED');
      expect((await listPending(admin.token)).map((u) => u.id)).not.toContain(
        target.id,
      );
    });

    it('criterio 2: rechazar deja la cuenta REJECTED y permite pedir verificación de nuevo', async () => {
      const target = await registerPending('c2-reject');

      const res = await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .set(auth(admin.token))
        .send({ approved: false, reason: 'Documento ilegible' })
        .expect(200);

      expect(res.body).toMatchObject({
        verificationStatus: 'REJECTED',
        verificationRejectionReason: 'Documento ilegible',
      });
      // La persona ve el motivo en su propio perfil.
      expect(
        (await http.get('/api/user/me').set(auth(target.token)).expect(200))
          .body.verificationRejectionReason,
      ).toBe('Documento ilegible');

      // Al volver a solicitar, el motivo anterior se limpia y la fecha se renueva.
      const firstRequest = (
        await http.get('/api/user/me').set(auth(target.token)).expect(200)
      ).body.verificationRequestedAt;
      await http
        .post('/api/user/me/verification')
        .set(auth(target.token))
        .expect(200, { verificationStatus: 'PENDING' });
      const me = (
        await http.get('/api/user/me').set(auth(target.token)).expect(200)
      ).body;
      expect(me.verificationRejectionReason).toBeNull();
      expect(new Date(me.verificationRequestedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(firstRequest).getTime(),
      );
    });

    it('criterio 2: rechazar sin motivo no guarda ninguno, y aprobar descarta el que se envíe', async () => {
      const rejected = await registerPending('c2-no-reason');
      const noReason = await http
        .patch(`/api/moderation/verifications/${rejected.id}`)
        .set(auth(moderator.token))
        .send({ approved: false, reason: '   ' })
        .expect(200);
      expect(noReason.body.verificationRejectionReason).toBeNull();

      const approved = await registerPending('c2-approve-reason');
      const res = await http
        .patch(`/api/moderation/verifications/${approved.id}`)
        .set(auth(admin.token))
        .send({ approved: true, reason: 'Todo en orden' })
        .expect(200);
      expect(res.body).toMatchObject({
        verificationStatus: 'VERIFIED',
        verificationRejectionReason: null,
      });
    });

    it('criterio 2: una solicitud ya resuelta, o que no existe, no se puede resolver otra vez', async () => {
      const target = await registerPending('c2-twice');
      await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .set(auth(moderator.token))
        .send({ approved: true })
        .expect(200);

      // Segundo intento: ya no está PENDING y el estado no cambia.
      await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .set(auth(admin.token))
        .send({ approved: false })
        .expect(409);
      expect(await statusOf(target.id)).toBe('VERIFIED');

      // Sin solicitud pendiente (UNVERIFIED).
      const idle = await register('c2-idle');
      await http
        .patch(`/api/moderation/verifications/${idle.id}`)
        .set(auth(moderator.token))
        .send({ approved: true })
        .expect(409);
      expect(await statusOf(idle.id)).toBe('UNVERIFIED');

      await http
        .patch('/api/moderation/verifications/00000000-0000-4000-8000-000000000000')
        .set(auth(moderator.token))
        .send({ approved: true })
        .expect(404);
    });

    it('criterio 2: dos moderadores resolviendo a la vez solo logran una resolución', async () => {
      const target = await registerPending('c2-race');

      const responses = await Promise.all([
        http
          .patch(`/api/moderation/verifications/${target.id}`)
          .set(auth(moderator.token))
          .send({ approved: true }),
        http
          .patch(`/api/moderation/verifications/${target.id}`)
          .set(auth(admin.token))
          .send({ approved: false }),
      ]);

      expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
      const winner = responses.find((r) => r.status === 200)!;
      expect(await statusOf(target.id)).toBe(winner.body.verificationStatus);
    });

    it('criterio 2: valida el id y el cuerpo, y exige rol de moderación', async () => {
      const target = await registerPending('c2-invalid');
      const user = await register('c2-user');

      await http
        .patch('/api/moderation/verifications/no-es-uuid')
        .set(auth(moderator.token))
        .send({ approved: true })
        .expect(400);

      for (const body of [
        {},
        { approved: 'true' },
        { approved: 1 },
        { approved: true, reason: 'a'.repeat(301) },
        { approved: true, verificationStatus: 'VERIFIED' },
        { approved: true, role: ['ADMIN'] },
      ]) {
        await http
          .patch(`/api/moderation/verifications/${target.id}`)
          .set(auth(moderator.token))
          .send(body)
          .expect(400);
      }

      await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .set(auth(user.token))
        .send({ approved: true })
        .expect(403);
      await http
        .patch(`/api/moderation/verifications/${target.id}`)
        .send({ approved: true })
        .expect(401);

      // Ninguna petición inválida cambió el estado.
      expect(await statusOf(target.id)).toBe('PENDING');
    });

    it.each(['MODERATOR', 'ADMIN'] as const)(
      'criterio 3: un %s no puede resolver su propia solicitud',
      async (role) => {
        const self = await registerWithRole(`c3-${role.toLowerCase()}`, role);
        await http
          .post('/api/user/me/verification')
          .set(auth(self.token))
          .expect(200);

        for (const approved of [true, false]) {
          await http
            .patch(`/api/moderation/verifications/${self.id}`)
            .set(auth(self.token))
            .send({ approved })
            .expect(403);
        }
        expect(await statusOf(self.id)).toBe('PENDING');

        // Otro miembro de moderación sí puede resolverla.
        const other = role === 'ADMIN' ? moderator : admin;
        const res = await http
          .patch(`/api/moderation/verifications/${self.id}`)
          .set(auth(other.token))
          .send({ approved: true })
          .expect(200);
        expect(res.body.verificationStatus).toBe('VERIFIED');
      },
    );
  });
});
