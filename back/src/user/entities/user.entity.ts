import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VerificationStatus } from '../enums/verification-status';
import { ValidRoles } from '../enums/valid-roles.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    unique: true,
  })
  email: string;

  @Column({
    type: 'text',
    select: false,
  })
  password?: string;

  @Column({
    type: 'text',
  })
  fullName: string;

  @Column({
    type: 'int',
    default: 0
  })
  tokenVersion: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  info: string | null;

  /** HU-03 · URL de la foto de perfil (null si no tiene). */
  @Column({
    type: 'text',
    nullable: true,
  })
  photoUrl: string | null;

  @Column({
    type: 'text',
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus: VerificationStatus;

  /** HU-19 · Cuándo la persona pidió la verificación (null si nunca la pidió). */
  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  verificationRequestedAt: Date | null;

  /**
   * HU-19 · Motivo del último rechazo, para que la persona sepa qué corregir.
   * Es null si no fue rechazada o si volvió a solicitar o fue aprobada.
   */
  @Column({
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  verificationRejectionReason: string | null;

  @Column({
    type: 'float',
    default: 0,
  })
  ratingAverage?: number;

  @Column({
    type: 'integer',
    default: 0,
  })
  reviewsCount: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: ValidRoles,
    array: true,
    default: [ValidRoles.USER],
  })
  role: ValidRoles[];

  @BeforeInsert()
  @BeforeUpdate()
  checkEmailBeforeChanges() {
    this.email = this.email.toLowerCase().trim();
  }
}
