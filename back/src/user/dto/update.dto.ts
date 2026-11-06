import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class UpdateUserDto extends PartialType(
  PickType(RegisterUserDto, ['fullName'] as const),
) {
  @ApiPropertyOptional({
    type: String,
    maxLength: 300,
    description: 'Información adicional del perfil, de hasta 300 caracteres.',
  })
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
      'HU-03 · URL http(s) de la foto de perfil. Enviar null la quita.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  photoUrl?: string | null;
}
