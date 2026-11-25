import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { VerificationStatus } from './enums/verification-status';
import { UserService } from './user.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'ana@example.com',
    password: 'hash',
    fullName: 'Ana Gomez',
    tokenVersion: 0,
    info: 'Vendedora local',
    photoUrl: 'https://images.example.com/ana.jpg',
    verificationStatus: VerificationStatus.UNVERIFIED,
    ratingAverage: 4.5,
    reviewsCount: 2,
    isActive: true,
    role: [ValidRoles.USER],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
    ...overrides,
  }) as User;

const makeQb = () => {
  const qb: any = {};
  ['select', 'andWhere', 'orderBy', 'skip', 'take'].forEach(
    (method) => (qb[method] = jest.fn().mockReturnValue(qb)),
  );
  qb.getManyAndCount = jest.fn().mockResolvedValue([[makeUser()], 1]);
  return qb;
};

describe('UserService', () => {
  let service: UserService;
  let qb: ReturnType<typeof makeQb>;
  const userRepository: any = {
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: { find: jest.fn(), count: jest.fn() },
  };
  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = makeQb();
    Object.assign(userRepository, {
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn((value) => ({ id: 'user-1', ...value })),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      preload: jest.fn(async (value) => makeUser(value)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      manager: {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    });
    jwtService.sign.mockReturnValue('signed-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('hashea la contrasena, guarda el usuario y devuelve token sin password', async () => {
      // Arrange
      const dto = {
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ana@example.com',
          fullName: 'Ana Gomez',
          password: expect.any(String),
        }),
      );
      const savedPassword = userRepository.create.mock.calls[0][0].password;
      expect(savedPassword).not.toBe(dto.password);
      await expect(bcrypt.compare(dto.password, savedPassword)).resolves.toBe(
        true,
      );
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'ana@example.com',
        token: 'signed-token',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('crea la cuenta como USER activa y sin verificar (HU-01 · criterio 1)', async () => {
      // Act
      const result = await service.create({
        email: 'nueva@example.com',
        password: 'Password1',
        fullName: 'Nueva Persona',
      });

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: [ValidRoles.USER],
          isActive: true,
          verificationStatus: VerificationStatus.UNVERIFIED,
        }),
      );
      expect(result).toMatchObject({
        role: [ValidRoles.USER],
        isActive: true,
        verificationStatus: VerificationStatus.UNVERIFIED,
        token: 'signed-token',
      });
      expect(result).not.toHaveProperty('tokenVersion');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', tokenVersion: 0 }),
      );
    });

    it('ignora un rol que llegue al servicio y siempre asigna USER', async () => {
      // Arrange: el ValidationPipe ya rechaza "role", pero el servicio no
      // debe confiar en ello (defensa en profundidad).
      const dto = {
        email: 'colado@example.com',
        password: 'Password1',
        fullName: 'Intento Admin',
        role: [ValidRoles.ADMIN],
        isActive: false,
      } as any;

      // Act
      const result = await service.create(dto);

      // Assert
      const created = userRepository.create.mock.calls[0][0];
      expect(created.role).toEqual([ValidRoles.USER]);
      expect(created.isActive).toBe(true);
      expect(result.role).toEqual([ValidRoles.USER]);
    });

    it('normaliza el correo antes de comprobar si ya existe', async () => {
      // Act
      await service.create({
        email: '  Ana@Example.COM ',
        password: 'Password1',
        fullName: '  Ana Gomez  ',
      });

      // Assert
      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { email: 'ana@example.com' },
      });
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ana@example.com',
          fullName: 'Ana Gomez',
        }),
      );
    });

    it('devuelve 409 y no guarda nada si el correo ya existe (HU-01 · criterio 2)', async () => {
      // Arrange
      userRepository.exists.mockResolvedValue(true);

      // Act
      const result = service.create({
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      });

      // Assert
      await expect(result).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('convierte duplicados de base de datos en ConflictException', async () => {
      // Arrange
      userRepository.save.mockRejectedValue({ code: '23505' });

      // Act
      const result = service.create({
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      });

      // Assert
      await expect(result).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('devuelve token cuando credenciales y estado son validos', async () => {
      // Arrange
      const password = await bcrypt.hash('Password1', 4);
      userRepository.findOne.mockResolvedValue(makeUser({ password }));

      // Act
      const result = await service.login({
        email: 'ana@example.com',
        password: 'Password1',
      });

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'ana@example.com' },
        select: { id: true, email: true, password: true, isActive: true, tokenVersion: true },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'ana@example.com',
        token: 'signed-token',
      });
    });

    it('rechaza usuario inexistente, inactivo o password incorrecta con el mismo error', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce(null);

      // Act / Assert
      await expect(
        service.login({ email: 'none@example.com', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      userRepository.findOne.mockResolvedValueOnce(
        makeUser({
          isActive: false,
          password: await bcrypt.hash('Password1', 4),
        }),
      );
      await expect(
        service.login({ email: 'ana@example.com', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      userRepository.findOne.mockResolvedValueOnce(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );
      await expect(
        service.login({ email: 'ana@example.com', password: 'WrongPass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('profile', () => {
    it('findMe no expone password y conserva info', () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = service.findMe(user);

      // Assert
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'ana@example.com',
        info: 'Vendedora local',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('updateMe bloquea cambio de nombre si esta verificado o pendiente', async () => {
      // Arrange
      const verified = makeUser({
        verificationStatus: VerificationStatus.VERIFIED,
      });
      const pending = makeUser({
        verificationStatus: VerificationStatus.PENDING,
      });
      userRepository.findOneBy.mockImplementation(async ({ id }) =>
        id === verified.id ? verified : pending,
      );

      // Act / Assert
      await expect(
        service.updateMe(verified, { fullName: 'Nuevo Nombre' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateMe(pending, { fullName: 'Nuevo Nombre' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updateMe actualiza campos permitidos', async () => {
      // Arrange
      const user = makeUser();
      userRepository.findOneBy.mockResolvedValue(user);
      userRepository.findOneBy.mockResolvedValueOnce(user).mockResolvedValueOnce(
        makeUser({ fullName: 'Ana Actualizada', info: 'Nueva bio' }),
      );

      // Act
      const result = await service.updateMe(user, {
        fullName: 'Ana Actualizada',
        info: 'Nueva bio',
      });

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          verificationStatus: expect.any(Object),
        }),
        { fullName: 'Ana Actualizada', info: 'Nueva bio' },
      );
      expect(result.info).toBe('Nueva bio');
    });

    it('updateMe permite cambiar el nombre en estado REJECTED', async () => {
      const rejected = makeUser({
        verificationStatus: VerificationStatus.REJECTED,
      });
      userRepository.findOneBy
        .mockResolvedValueOnce(rejected)
        .mockResolvedValueOnce(
          makeUser({
            verificationStatus: VerificationStatus.REJECTED,
            fullName: 'Nombre corregido',
          }),
        );

      await expect(
        service.updateMe(rejected, { fullName: 'Nombre corregido' }),
      ).resolves.toMatchObject({ fullName: 'Nombre corregido' });
    });

    it('updateMe consulta el estado persistido y evita una actualización parcial', async () => {
      const staleJwtUser = makeUser({
        verificationStatus: VerificationStatus.UNVERIFIED,
      });
      userRepository.findOneBy.mockResolvedValue(
        makeUser({ verificationStatus: VerificationStatus.PENDING }),
      );

      await expect(
        service.updateMe(staleJwtUser, {
          fullName: 'Nombre nuevo',
          info: 'Bio nueva',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(userRepository.preload).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('HU-03 · findMe incluye foto, verificación y reputación', () => {
      // Act
      const result = service.findMe(makeUser());

      // Assert
      expect(result).toMatchObject({
        fullName: 'Ana Gomez',
        email: 'ana@example.com',
        photoUrl: 'https://images.example.com/ana.jpg',
        verificationStatus: VerificationStatus.UNVERIFIED,
        ratingAverage: 4.5,
        reviewsCount: 2,
      });
    });

    it('HU-03 · findMe devuelve photoUrl null cuando no hay foto', () => {
      // Act
      const result = service.findMe(makeUser({ photoUrl: null }));

      // Assert
      expect(result.photoUrl).toBeNull();
    });

    it('HU-03 · updateMe guarda la foto de perfil', async () => {
      userRepository.findOneBy.mockResolvedValue(makeUser({ photoUrl: null }));
      // Act
      const result = await service.updateMe(makeUser({ photoUrl: null }), {
        photoUrl: 'https://images.example.com/nueva.jpg',
      });

      // Assert
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: 'user-1',
        photoUrl: 'https://images.example.com/nueva.jpg',
      });
      expect(result.photoUrl).toBe('https://images.example.com/nueva.jpg');
    });

    it('updateMe devuelve 404 si preload no encuentra el usuario', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());
      userRepository.preload.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.updateMe(makeUser(), { info: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findPublicProfile devuelve solo usuarios activos', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const result = await service.findPublicProfile('user-1');

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 'user-1',
        isActive: true,
      });
      expect(result.id).toBe('user-1');
    });

    it('HU-07 · findPublicProfile presenta ratingAverage, reviewsCount y reseñas recientes (criterio 2)', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());
      userRepository.manager.find.mockResolvedValue([
        {
          rating: 5,
          comment: 'Todo bien',
          createdAt: new Date('2026-10-20T10:00:00Z'),
          reviewer: { fullName: 'Carlos Ruiz', email: 'carlos@x.com', password: 'h' },
        },
      ]);
      userRepository.manager.count.mockResolvedValue(3);

      // Act
      const result = await service.findPublicProfile('user-1');

      // Assert
      expect(result).toMatchObject({
        fullName: 'Ana Gomez',
        ratingAverage: 4.5,
        reviewsCount: 2,
        availableProductsCount: 3,
        verificationStatus: VerificationStatus.UNVERIFIED,
        memberSince: new Date('2026-10-01T10:00:00Z'),
        recentReviews: [
          { rating: 5, comment: 'Todo bien', reviewerName: 'Carlos Ruiz' },
        ],
      });
      expect(userRepository.manager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: { targetUserId: 'user-1' },
          order: { createdAt: 'DESC' },
          take: 5,
        }),
      );
    });

    it('HU-07 · sin reseñas, ratingAverage es 0 y no null', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(
        makeUser({ ratingAverage: undefined, reviewsCount: 0 }),
      );

      // Act
      const result = await service.findPublicProfile('user-1');

      // Assert
      expect(result.ratingAverage).toBe(0);
      expect(result.reviewsCount).toBe(0);
      expect(result.recentReviews).toEqual([]);
    });

    it('HU-07 · no expone contraseña, correo, rol ni datos de autenticación (criterio 3)', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());
      userRepository.manager.find.mockResolvedValue([
        { rating: 4, comment: null, createdAt: new Date(), reviewer: makeUser() },
      ]);

      // Act
      const json = JSON.stringify(await service.findPublicProfile('user-1'));

      // Assert
      for (const secret of ['password', 'hash', 'email', 'ana@example.com', 'tokenVersion', 'role', 'isActive']) {
        expect(json).not.toContain(secret);
      }
    });

    it('findPublicProfile devuelve 404 si no existe usuario activo', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findPublicProfile('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findProfile busca por email normalizado, luego por nombre y puede devolver undefined', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValueOnce(makeUser());

      // Act
      const byEmail = await service.findProfile({ email: ' ANA@EXAMPLE.COM ' });

      // Assert
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'ana@example.com',
      });
      expect(byEmail?.id).toBe('user-1');

      userRepository.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeUser());
      const byName = await service.findProfile({
        email: 'missing@example.com',
        fullName: 'Ana Gomez',
      });
      expect(byName?.id).toBe('user-1');

      userRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.findProfile({ fullName: 'Nadie' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('security changes', () => {
    it('changePassword valida password actual y rechaza reutilizarla', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changePassword(makeUser(), {
          currentPassword: 'Password1',
          newPassword: 'Password1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('changePassword actualiza hash si la password actual coincide', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act
      const result = await service.changePassword(makeUser(), {
        currentPassword: 'Password1',
        newPassword: 'Password2',
      });

      // Assert
      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        password: expect.any(String),
      });
    });

    it('changePassword y changeEmail rechazan password actual incorrecta', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changePassword(makeUser(), {
          currentPassword: 'bad',
          newPassword: 'Password2',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.changeEmail(makeUser(), {
          currentPassword: 'bad',
          newEmail: 'new@example.com',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('changeEmail normaliza, valida diferencia y devuelve perfil actualizado', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );
      userRepository.findOneBy.mockResolvedValue(
        makeUser({ email: 'new@example.com' }),
      );

      // Act
      const result = await service.changeEmail(makeUser(), {
        currentPassword: 'Password1',
        newEmail: ' NEW@EXAMPLE.COM ',
      });

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('changeEmail rechaza usar el mismo email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(
        makeUser({ password: await bcrypt.hash('Password1', 4) }),
      );

      // Act / Assert
      await expect(
        service.changeEmail(makeUser(), {
          currentPassword: 'Password1',
          newEmail: ' ana@example.com ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('admin queries', () => {
    it('findAll aplica filtros, busqueda escapada y paginacion', async () => {
      // Arrange
      const query = {
        limit: 10,
        skip: 5,
        role: ValidRoles.USER,
        isActive: true,
        verificationStatus: VerificationStatus.PENDING,
        search: 'ana_%',
      };

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(':role = ANY(user.role)', {
        role: ValidRoles.USER,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.verificationStatus = :verificationStatus',
        { verificationStatus: VerificationStatus.PENDING },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :term OR user.fullName ILIKE :term)',
        { term: '%ana\\_\\%%' },
      );
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toMatchObject({ total: 1, limit: 10, skip: 5 });
    });

    it('findOneAdmin, adminUpdate, changeRoles y setActiveStatus usan get/preload y protecciones', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const adminProfile = await service.findOneAdmin('user-1');
      const updated = await service.adminUpdate('user-1', {
        info: 'Admin edit',
      });
      const roles = await service.changeRoles(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
        { roles: [ValidRoles.MODERATOR] },
      );
      const inactive = await service.setActiveStatus(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
        { isActive: false },
      );

      // Assert
      expect(adminProfile.id).toBe('user-1');
      expect(updated.info).toBe('Admin edit');
      expect(roles.role).toEqual([ValidRoles.MODERATOR]);
      expect(inactive.isActive).toBe(false);
    });

    it('adminUpdate devuelve 404 si preload no encuentra el usuario', async () => {
      // Arrange
      userRepository.preload.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.adminUpdate('x', { fullName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('impide quitarse admin o desactivarse a si mismo', async () => {
      // Arrange
      const admin = makeUser({ role: [ValidRoles.ADMIN] });

      // Act / Assert
      await expect(
        service.changeRoles(admin, admin.id, { roles: [ValidRoles.USER] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.setActiveStatus(admin, admin.id, { isActive: false }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('HU-20 · desactivar sube tokenVersion y conserva los datos; reactivar no la cambia', async () => {
      // Arrange
      const admin = makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] });
      userRepository.findOneBy.mockResolvedValueOnce(
        makeUser({ tokenVersion: 3 }),
      );

      // Act
      await service.setActiveStatus(admin, 'user-1', { isActive: false });
      const saved = userRepository.save.mock.calls.at(-1)[0] as User;

      // Assert
      expect(saved.isActive).toBe(false);
      expect(saved.tokenVersion).toBe(4);
      expect(saved.email).toBe('ana@example.com');
      expect(saved.fullName).toBe('Ana Gomez');

      // Arrange: reactivar la misma cuenta
      userRepository.findOneBy.mockResolvedValueOnce(
        makeUser({ isActive: false, tokenVersion: 4 }),
      );

      // Act
      await service.setActiveStatus(admin, 'user-1', { isActive: true });
      const reactivated = userRepository.save.mock.calls.at(-1)[0] as User;

      // Assert
      expect(reactivated.isActive).toBe(true);
      expect(reactivated.tokenVersion).toBe(4);
    });

    it('HU-20 · el admin sí puede dejarse ADMIN junto con otros roles', async () => {
      // Arrange
      const admin = makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] });
      userRepository.findOneBy.mockResolvedValue(admin);

      // Act
      const result = await service.changeRoles(admin, admin.id, {
        roles: [ValidRoles.ADMIN, ValidRoles.MODERATOR],
      });

      // Assert
      expect(result.role).toEqual([ValidRoles.ADMIN, ValidRoles.MODERATOR]);
    });

    it('remove hace soft delete mediante setActiveStatus', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser());

      // Act
      const result = await service.remove(
        makeUser({ id: 'admin-1', role: [ValidRoles.ADMIN] }),
        'user-1',
      );

      // Assert
      expect(result.isActive).toBe(false);
    });
  });

  describe('verification', () => {
    it.each([
      VerificationStatus.UNVERIFIED,
      VerificationStatus.REJECTED,
    ])('requestVerification permite %s -> PENDING', async (status) => {
      // Arrange
      const user = makeUser({ verificationStatus: status });

      // Act
      const result = await service.requestVerification(user);

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(
        {
          id: 'user-1',
          verificationStatus: expect.objectContaining({
            _type: 'in',
            _value: [VerificationStatus.UNVERIFIED, VerificationStatus.REJECTED],
          }),
        },
        {
          verificationStatus: VerificationStatus.PENDING,
          verificationRequestedAt: expect.any(Date),
          verificationRejectionReason: null,
        },
      );
      expect(result).toEqual({
        verificationStatus: VerificationStatus.PENDING,
      });
    });

    it.each([VerificationStatus.PENDING, VerificationStatus.VERIFIED])(
      'requestVerification rechaza %s sin alterar el estado',
      async (status) => {
        userRepository.update.mockResolvedValue({ affected: 0 });
        userRepository.findOneBy.mockResolvedValue(
          makeUser({ verificationStatus: status }),
        );

        await expect(
          service.requestVerification(makeUser({ verificationStatus: status })),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(userRepository.save).not.toHaveBeenCalled();
      },
    );

    it('findPendingVerifications delega en findAll con orden antiguo primero', async () => {
      // Act
      await service.findPendingVerifications({ limit: 20, skip: 0 });

      // Assert
      expect(qb.orderBy).toHaveBeenCalledWith(
        'user.verificationRequestedAt',
        'ASC',
        'NULLS FIRST',
      );
    });
  });

  describe('HU-19 · resolver verificaciones', () => {
    const moderator = () =>
      makeUser({ id: 'moderator-1', role: [ValidRoles.MODERATOR] });

    it('criterio 1: findPendingVerifications filtra PENDING, pagina y ordena por antigüedad', async () => {
      // Arrange
      qb.getManyAndCount.mockResolvedValue([
        [makeUser({ verificationStatus: VerificationStatus.PENDING })],
        7,
      ]);

      // Act
      const result = await service.findPendingVerifications({
        limit: 5,
        skip: 10,
      });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        'user.verificationStatus = :verificationStatus',
        { verificationStatus: VerificationStatus.PENDING },
      );
      expect(qb.orderBy).toHaveBeenCalledWith(
        'user.verificationRequestedAt',
        'ASC',
        'NULLS FIRST',
      );
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toMatchObject({ total: 7, limit: 5, skip: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('password');
    });

    it('criterio 1: cada solicitud trae foto, información y la fecha en que se pidió', async () => {
      // Act
      await service.findPendingVerifications({ limit: 20, skip: 0 });

      // Assert
      expect(qb.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'user.photoUrl',
          'user.info',
          'user.verificationRequestedAt',
          'user.verificationRejectionReason',
        ]),
      );
    });

    it.each([
      [true, VerificationStatus.VERIFIED],
      [false, VerificationStatus.REJECTED],
    ])(
      'criterio 2: approved=%s deja la solicitud en %s con un UPDATE condicional',
      async (approved, expected) => {
        // Arrange
        userRepository.findOneBy.mockResolvedValue(
          makeUser({ id: 'target-1', verificationStatus: expected }),
        );

        // Act
        const result = await service.resolveVerification(
          moderator(),
          'target-1',
          { approved },
        );

        // Assert
        expect(userRepository.update).toHaveBeenCalledWith(
          { id: 'target-1', verificationStatus: VerificationStatus.PENDING },
          { verificationStatus: expected, verificationRejectionReason: null },
        );
        expect(userRepository.save).not.toHaveBeenCalled();
        expect(result.verificationStatus).toBe(expected);
        expect(result).not.toHaveProperty('password');
      },
    );

    it('criterio 2: al rechazar guarda el motivo (sin espacios sobrantes) para que la persona lo vea', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(
        makeUser({
          id: 'target-1',
          verificationStatus: VerificationStatus.REJECTED,
        }),
      );

      // Act
      await service.resolveVerification(moderator(), 'target-1', {
        approved: false,
        reason: '  Documento ilegible  ',
      });

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(expect.anything(), {
        verificationStatus: VerificationStatus.REJECTED,
        verificationRejectionReason: 'Documento ilegible',
      });
    });

    it.each([undefined, '', '   '])(
      'criterio 2: rechazar con motivo %j no guarda ningún motivo',
      async (reason) => {
        // Arrange
        userRepository.findOneBy.mockResolvedValue(
          makeUser({ id: 'target-1' }),
        );

        // Act
        await service.resolveVerification(moderator(), 'target-1', {
          approved: false,
          reason,
        });

        // Assert
        expect(userRepository.update).toHaveBeenCalledWith(expect.anything(), {
          verificationStatus: VerificationStatus.REJECTED,
          verificationRejectionReason: null,
        });
      },
    );

    it('criterio 2: aprobar descarta el motivo aunque se envíe', async () => {
      // Arrange
      userRepository.findOneBy.mockResolvedValue(makeUser({ id: 'target-1' }));

      // Act
      await service.resolveVerification(moderator(), 'target-1', {
        approved: true,
        reason: 'Todo en orden',
      });

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(expect.anything(), {
        verificationStatus: VerificationStatus.VERIFIED,
        verificationRejectionReason: null,
      });
    });

    it.each([
      VerificationStatus.UNVERIFIED,
      VerificationStatus.VERIFIED,
      VerificationStatus.REJECTED,
    ])('devuelve 409 si el usuario está %s y no tiene solicitud pendiente', async (status) => {
      // Arrange
      userRepository.update.mockResolvedValue({ affected: 0 });
      userRepository.findOneBy.mockResolvedValue(
        makeUser({ id: 'target-1', verificationStatus: status }),
      );

      // Act / Assert
      await expect(
        service.resolveVerification(moderator(), 'target-1', {
          approved: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('devuelve 404 si el usuario no existe', async () => {
      // Arrange
      userRepository.update.mockResolvedValue({ affected: 0 });
      userRepository.findOneBy.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.resolveVerification(moderator(), 'missing', {
          approved: true,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each([ValidRoles.MODERATOR, ValidRoles.ADMIN])(
      'criterio 3: un %s no puede resolver su propia solicitud',
      async (role) => {
        // Arrange
        const self = makeUser({
          id: 'self-1',
          role: [role],
          verificationStatus: VerificationStatus.PENDING,
        });

        // Act / Assert
        await expect(
          service.resolveVerification(self, 'self-1', { approved: true }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(userRepository.update).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
      },
    );

    it('convierte un error inesperado de base de datos en 500', async () => {
      // Arrange
      userRepository.update.mockRejectedValue(new Error('db down'));

      // Act / Assert
      await expect(
        service.resolveVerification(moderator(), 'target-1', {
          approved: true,
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('errors', () => {
    it('convierte errores no esperados en InternalServerErrorException', async () => {
      // Arrange
      userRepository.save.mockRejectedValue(new Error('db down'));

      // Act
      const result = service.create({
        email: 'ana@example.com',
        password: 'Password1',
        fullName: 'Ana Gomez',
      });

      // Assert
      await expect(result).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
