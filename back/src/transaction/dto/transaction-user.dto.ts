import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class TransactionUserDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Identificador único del participante.',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Nombre completo del participante.',
  })
  fullName: string;

  @ApiProperty({ type: String, format: 'uri', nullable: true, description: 'Foto de perfil o null.' })
  photoUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'bici:#F77F00', description: 'TRD-25 · Avatar de objeto o null.' })
  avatar: string | null;

  static fromEntity(user?: User): TransactionUserDto | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      fullName: user.fullName,
      photoUrl: user.photoUrl ?? null,
      avatar: user.avatar ?? null,
    };
  }
}
