import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveVerification {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'true aprueba la solicitud; false la rechaza.',
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'Documento ilegible',
    maxLength: 300,
    description:
      'Motivo de hasta 300 caracteres. Al rechazar se guarda en el perfil (verificationRejectionReason) y la persona lo ve; al aprobar se descarta. También se registra en logs.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
