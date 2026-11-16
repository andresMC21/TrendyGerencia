import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '../enums/verification-status';

export class VerificationRequestResponseDto {
  @ApiProperty({
    enum: [VerificationStatus.PENDING],
    example: VerificationStatus.PENDING,
    description: 'Nuevo estado de la solicitud de verificación.',
  })
  verificationStatus: VerificationStatus.PENDING;
}
