import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, type: 'text' })
  emailVerificationToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  lastVerificationEmailSentAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetTokenExpiresAt: Date | null;

  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    cascade: true,
  })
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
