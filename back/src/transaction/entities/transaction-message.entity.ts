import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Transaction } from './transaction.entity';

/** TRD-25 · Mensaje del chat entre comprador y vendedor de una transacción. */
@Entity()
export class TransactionMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Transaction, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'varchar', length: 500 })
  body: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
