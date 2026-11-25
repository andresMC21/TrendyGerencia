import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ResolveVerification } from './verification.dto';

/** HU-19 · PATCH /moderation/verifications/:userId: mismas opciones que el ValidationPipe global. */
describe('ResolveVerification (HU-19)', () => {
  const run = (body: Record<string, unknown>) => {
    const dto = plainToInstance(ResolveVerification, body);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    return { dto, errors };
  };

  it.each([true, false])('acepta approved=%s sin motivo', (approved) => {
    expect(run({ approved }).errors).toHaveLength(0);
  });

  it('acepta un motivo de hasta 300 caracteres y rechaza 301', () => {
    expect(
      run({ approved: false, reason: 'a'.repeat(300) }).errors,
    ).toHaveLength(0);
    const { errors } = run({ approved: false, reason: 'a'.repeat(301) });
    expect(errors.map((e) => e.property)).toEqual(['reason']);
  });

  it.each([
    ['sin approved', {}],
    ['approved como texto', { approved: 'true' }],
    ['approved numérico', { approved: 1 }],
    ['approved null', { approved: null }],
    ['reason no string', { approved: true, reason: 42 }],
    ['estado impuesto por el cliente', { approved: true, verificationStatus: 'VERIFIED' }],
    ['campo extra role', { approved: true, role: ['ADMIN'] }],
  ])('rechaza: %s', (_label, body) => {
    expect(run(body).errors.length).toBeGreaterThan(0);
  });
});
