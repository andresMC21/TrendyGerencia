
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
      expect((await http.get(`/api/user/${userId}`).expect(200)).body.photoUrl).toBe(url);

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

  it('GET /user/:id devuelve el perfil público autenticado', async () => {
    const res = await http
      .get(`/api/user/${userId}`)
      .set(auth(token))
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: `${emailPrefix}changed@test.com`,
      fullName: 'E2E User Updated',
    });

    expect(res.body.password).toBeUndefined();
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

});
