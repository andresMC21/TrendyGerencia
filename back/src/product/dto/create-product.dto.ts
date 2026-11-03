import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductCondition } from '../enums/product-condition.enum';
import { GeoPointDto } from './geo-point.dto';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimLowerString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Slug del barrio: minúsculas, números y guiones (p. ej. `san-fernando`). */
export const NEIGHBORHOOD_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * HU-08 · Publicar un producto.
 *
 * El vendedor y el estado no forman parte del cuerpo: el vendedor se toma del
 * JWT y el producto siempre nace AVAILABLE. Si el cliente envía `sellerId`,
 * `status` u otro campo desconocido, el ValidationPipe global (`whitelist` +
 * `forbidNonWhitelisted`) responde 400. Los textos se recortan antes de
 * validar, de modo que un valor formado solo por espacios se rechaza.
 */
export class CreateProductDto {
  @ApiProperty({
    type: String,
    example: 'Bicicleta MTB {{neighborhoodId}}',
    minLength: 3,
    maxLength: 120,
    description:
      'Título del producto, entre 3 y 120 caracteres; se eliminan los espacios externos.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    type: String,
    example: 'Rin 26, cambios Shimano, poco uso',
    maxLength: 2000,
    description:
      'Descripción del producto, de hasta 2000 caracteres; se eliminan los espacios externos.',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    type: Number,
    example: 250000,
    default: 0,
    minimum: 0,
    maximum: 9999999999,
    multipleOf: 0.01,
    description:
      'Precio con hasta dos decimales; usa 0 para donación o trueque.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999)
  price?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    default: false,
    description: 'Indica si se acepta trueque.',
  })
  @IsOptional()
  @IsBoolean()
  acceptsBarter?: boolean;

  @ApiProperty({
    type: String,
    example: 'deportes',
    maxLength: 60,
    description:
      'Categoría del producto, de hasta 60 caracteres; se normaliza a minúsculas y sin espacios externos.',
  })
  @Transform(trimLowerString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category: string;

  @ApiProperty({
    type: String,
    enum: ProductCondition,
    example: ProductCondition.LIKE_NEW,
    description: 'Condición del producto.',
  })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiProperty({
    type: GeoPointDto,
    description: 'Ubicación geográfica expresada como latitud y longitud.',
  })
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @ApiProperty({
    type: String,
    example: '{{neighborhoodId}}',
    maxLength: 60,
    pattern: NEIGHBORHOOD_SLUG.source,
    description:
      'Identificador (slug) del barrio usado para el filtro hiperlocal: minúsculas, números y guiones, p. ej. san-fernando. Se normaliza a minúsculas y sin espacios externos.',
  })
  @Transform(trimLowerString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(NEIGHBORHOOD_SLUG, {
    message:
      'neighborhoodId must be a slug of lowercase letters, numbers and hyphens',
  })
  neighborhoodId: string;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5,
    minimum: 0,
    maximum: 100000,
    exclusiveMinimum: true,
    description:
      'Peso estimado en kilogramos para calcular el impacto ambiental.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100000)
  estimatedWeightKg?: number;
}
