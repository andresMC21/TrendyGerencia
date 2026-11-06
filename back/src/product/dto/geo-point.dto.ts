import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNumber } from 'class-validator';
import { GeoPoint } from '../interfaces/geo.interface';

export class GeoPointDto implements GeoPoint {
  @ApiProperty({
    type: Number,
    example: 3.4516,
    minimum: -90,
    maximum: 90,
    description: 'Latitud en grados, entre -90 y 90.',
  })
  // IsLatitude/IsLongitude también aceptan strings; se exige un número real.
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLatitude()
  lat: number;

  @ApiProperty({
    type: Number,
    example: -76.532,
    minimum: -180,
    maximum: 180,
    description: 'Longitud en grados, entre -180 y 180.',
  })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLongitude()
  lng: number;
}
