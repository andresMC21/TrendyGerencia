import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

/**
 * HU-16 · Punto seguro y horario de una propuesta de encuentro.
 *
 * Se usa para proponer (o contraproponer) y también para aceptar: quien acepta
 * envía la propuesta que vio, y si la otra persona la cambió mientras tanto la
 * API responde 409 en lugar de aceptar algo distinto.
 */
export class MeetingProposalDto {
  @ApiProperty({
    type: String,
    example: 'sp-1',
    minLength: 1,
    description: 'Identificador del punto seguro donde se encontrarán.',
  })
  @IsString()
  @IsNotEmpty()
  safePointId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2030-10-05T15:00:00Z',
    description: 'Fecha y hora del encuentro en formato de fecha ISO 8601.',
  })
  @IsDateString()
  scheduledTime: string;
}
