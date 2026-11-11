import 'reflect-metadata';
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
});
