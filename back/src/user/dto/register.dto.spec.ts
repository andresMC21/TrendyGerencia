import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { RegisterUserDto } from './register.dto';

/**
 * HU-01 · criterio 3: datos inválidos o intento de asignar un rol → 400.
 * Se usa la misma configuración del ValidationPipe global de main.ts.
 */
describe('RegisterUserDto (HU-01)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validate = (body: Record<string, unknown>) =>
    pipe.transform(body, { type: 'body', metatype: RegisterUserDto });

  const validBody = {
    email: 'nueva@trendy.test',
    password: 'Passw0rd1',
    fullName: 'Nueva Persona',
  };

  it('acepta datos válidos y normaliza correo y nombre', async () => {
    const dto = await validate({
      email: '  Nueva@Trendy.TEST ',
      password: 'Passw0rd1',
      fullName: '  Nueva Persona  ',
    });

    expect(dto).toBeInstanceOf(RegisterUserDto);
    expect(dto.email).toBe('nueva@trendy.test');
    expect(dto.fullName).toBe('Nueva Persona');
  });

  it.each([
    ['role como arreglo', { role: ['ADMIN'] }],
    ['role como texto', { role: 'MODERATOR' }],
    ['isActive', { isActive: false }],
    ['verificationStatus', { verificationStatus: 'VERIFIED' }],
    ['un campo desconocido', { extra: true }],
  ])('rechaza con 400 si se envía %s', async (_label, extra) => {
    await expect(validate({ ...validBody, ...extra })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('indica en el mensaje que role no está permitido', async () => {
    const error = await validate({ ...validBody, role: ['ADMIN'] }).catch(
      (e: BadRequestException) => e,
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect(
      JSON.stringify((error as BadRequestException).getResponse()),
    ).toContain('property role should not exist');
  });

  it.each([
    ['correo inválido', { email: 'correo-invalido' }],
    ['correo vacío', { email: '' }],
    ['correo ausente', { email: undefined }],
    ['correo demasiado largo', { email: `${'a'.repeat(250)}@x.co` }],
    ['contraseña corta', { password: '1234567' }],
    ['contraseña larga', { password: 'a'.repeat(13) }],
    ['contraseña que no es texto', { password: 12345678 }],
    ['nombre vacío', { fullName: '' }],
    ['nombre solo con espacios', { fullName: '    ' }],
    ['nombre de un carácter', { fullName: 'A' }],
    ['nombre demasiado largo', { fullName: 'a'.repeat(101) }],
    ['nombre ausente', { fullName: undefined }],
  ])('rechaza con 400: %s', async (_label, override) => {
    await expect(
      validate({ ...validBody, ...override }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
