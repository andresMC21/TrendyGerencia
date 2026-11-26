import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  isURL,
  Matches,
  MaxLength,
  registerDecorator,
  ValidateIf,
  type ValidationOptions,
} from 'class-validator';

const PHOTO_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** HU-03 · URL http(s) de hasta 2048 caracteres o, desde TRD-25, una foto subida desde la web. */
function IsProfilePhoto(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isProfilePhoto',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} must be an http(s) URL or an image data URL`, ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          ((value.length <= 2048 && isURL(value, { protocols: ['http', 'https'], require_protocol: true })) ||
            (value.length <= 300000 && PHOTO_DATA_URL.test(value))),
      },
    });
}

/** TRD-25 · Objetos y colores de avatar que ofrece la web. */
export const AVATAR_PATTERN =
  /^(planta|camara|bici|guitarra|libros|audifonos|lampara|silla|chaqueta|zapatos):#(FCBF49|F77F00|BFD7E6|CFE3C8|F3D9C9)$/;
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
  { skipNullProperties: false },
) {
  @ApiPropertyOptional({
    type: String,
    maxLength: 300,
    description:
      'HU-04 · Información adicional del perfil, de hasta 300 caracteres; se eliminan los espacios externos.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  info?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uri',
    nullable: true,
    maxLength: 2048,
    example: 'https://images.example.com/fotos/ana.jpg',
    description:
      'HU-03 · URL http(s) de la foto de perfil (o, desde TRD-25, una foto JPEG/PNG/WebP en data URL de hasta 300000 caracteres). Enviar null la quita.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsProfilePhoto()
  photoUrl?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'planta:#FCBF49',
    description:
      'TRD-25 · Avatar de objeto: «objeto:#COLOR» con un objeto y un color de la paleta. Enviar null vuelve al automático.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Matches(AVATAR_PATTERN, { message: 'avatar no es un objeto y color válidos' })
  avatar?: string | null;
}
