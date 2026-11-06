import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity()
// HU-15 · Una sola transacción activa (PENDING o AGREED_POINT) por producto.
@Index('UQ_transaction_active_product', ['productId'], {
  unique: true,
  where: `"status" IN ('PENDING', 'AGREED_POINT')`,
})
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Index()
  @Column({ type: 'varchar' })
  buyerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Index()
  @Column({ type: 'varchar' })
  sellerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Index()
  @Column({ type: 'text', default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  safePointId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledTime: Date | null;

  /**
   * HU-16 · Quién hizo la propuesta de punto y horario que está vigente.
   * Mientras la transacción siga en PENDING, la otra persona debe aceptarla.
   */
  @Column({ type: 'uuid', nullable: true })
  proposedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'proposedById',
    foreignKeyConstraintName: 'FK_transaction_proposed_by',
  })
  proposedBy?: User | null;

  /**
   * HU-16 · Último rechazo de una propuesta: quién la rechazó, cuándo y qué
   * punto y horario rechazó. Se conserva hasta que llegue una propuesta nueva,
   * para que quien propuso se entere.
   */
  @Column({ type: 'uuid', nullable: true })
  rejectedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'rejectedById',
    foreignKeyConstraintName: 'FK_transaction_rejected_by',
  })
  rejectedBy?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectedSafePointId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedScheduledTime: Date | null;

  /** HU-16 · Momento en que la otra persona aceptó la propuesta. */
  @Column({ type: 'timestamptz', nullable: true })
  agreedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'text',
    nullable: true
  })
  message: string | null;

}
