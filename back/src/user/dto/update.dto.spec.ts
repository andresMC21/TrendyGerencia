import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateUserDto } from './update.dto';

/** HU-04 · PATCH /user/me: mismas opciones que el ValidationPipe global. */
describe('UpdateUserDto (HU-04)', () => {
  const run = (body: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateUserDto, body);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    return { dto, errors };
  };

  it('acepta fullName e info válidos y aplica trim', () => {
    const { dto, errors } = run({ fullName: '  Ana Pérez  ', info: '  Hola  ' });

    expect(errors).toHaveLength(0);
    expect(dto.fullName).toBe('Ana Pérez');
    expect(dto.info).toBe('Hola');
  });

  it('acepta info de 300 caracteres y rechaza 301', () => {
    expect(run({ info: 'a'.repeat(300) }).errors).toHaveLength(0);
    const { errors } = run({ info: 'a'.repeat(301) });
    expect(errors.map((e) => e.property)).toEqual(['info']);
  });

  it.each([
    ['fullName de 1 carácter', { fullName: 'A' }],
    ['fullName de 101 caracteres', { fullName: 'a'.repeat(101) }],
    ['fullName no string', { fullName: 123 }],
    ['fullName null', { fullName: null }],
    ['info no string', { info: 42 }],
    ['campo extra email', { email: 'x@trendy.test' }],
    ['campo extra verificationStatus', { verificationStatus: 'VERIFIED' }],
  ])('rechaza: %s', (_label, body) => {
    expect(run(body).errors.length).toBeGreaterThan(0);
  });

  it('acepta un cuerpo vacío', () => {
    expect(run({}).errors).toHaveLength(0);
  });

  it('acepta photoUrl null', () => {
    const { dto, errors } = run({ photoUrl: null });
    expect(errors).toHaveLength(0);
    expect(dto.photoUrl).toBeNull();
  });

  it('el ValidationPipe rechaza fullName null con 400', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    try {
      await pipe.transform({ fullName: null }, { type: 'body', metatype: UpdateUserDto });
      throw new Error('Se esperaba rechazar el nombre nulo');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getStatus()).toBe(400);
    }
  });

  describe('TRD-25 · avatar y foto subida', () => {
    it('acepta un avatar de objeto y color del catálogo, y null para quitarlo', () => {
      expect(run({ avatar: 'bici:#F77F00' }).errors).toHaveLength(0);
      expect(run({ avatar: null }).errors).toHaveLength(0);
    });

    it.each(['bici', 'bici:#000000', 'cohete:#F77F00', '<script>:#F77F00', 42])('rechaza el avatar %p', (avatar) => {
      expect(run({ avatar }).errors.map((e) => e.property)).toEqual(['avatar']);
    });

    it('acepta una foto JPEG en data URL y una URL https', () => {
      expect(run({ photoUrl: 'data:image/jpeg;base64,QUJD' }).errors).toHaveLength(0);
      expect(run({ photoUrl: 'https://cdn.trendy.test/a.jpg' }).errors).toHaveLength(0);
    });

    it.each([
      ['data URL de otro tipo', 'data:image/svg+xml;base64,QUJD'],
      ['data URL demasiado grande', `data:image/png;base64,${'A'.repeat(300000)}`],
      ['javascript:', 'javascript:alert(1)'],
      ['URL sin protocolo', 'trendy.test/a.jpg'],
    ])('rechaza photoUrl: %s', (_label, photoUrl) => {
      expect(run({ photoUrl }).errors.map((e) => e.property)).toEqual(['photoUrl']);
    });
  });
});
