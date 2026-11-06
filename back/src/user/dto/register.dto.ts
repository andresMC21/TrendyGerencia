import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * HU-01 · Crear una cuenta.
 *
 * Solo acepta email, password y fullName. Cualquier otro campo (por ejemplo
 * `role`, `isActive` o `verificationStatus`) se rechaza con 400 gracias al
 * ValidationPipe global con `whitelist` + `forbidNonWhitelisted`: un visitante
 * no puede asignarse un rol ni alterar el estado de su cuenta al registrarse.
 */
export class RegisterUserDto {
  @ApiProperty({
    type: String,
    format: 'email',
    maxLength: 254,
    example: 'vendedor.postman@trendy.test',
    description:
      'Correo electrónico de la cuenta; se normaliza a minúsculas y sin espacios externos. Debe ser único.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 12,
    example: 'Passw0rd1',
    writeOnly: true,
    description: 'Contraseña de 8 a 12 caracteres.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  password: string;

  @ApiProperty({
    type: String,
    minLength: 2,
    maxLength: 100,
    example: 'Vendedor Postman',
    description:
      'Nombre completo de la persona registrada; se eliminan los espacios externos.',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;
}
