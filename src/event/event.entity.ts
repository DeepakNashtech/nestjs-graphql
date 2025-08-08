import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserEvent } from '../user-event/user-event.entity';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ name: 'event_name' })
  event_name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  location: string;

  @Column()
  trending: boolean;

  @Column()
  registration_fee: number;

  @Column({ name: 'event_start_date', type: 'timestamp' })
  event_start_date: Date;

  @Column({ name: 'event_end_date', type: 'timestamp' })
  event_end_date: Date;

  @Column()
  description: string;

  @Column({ name: 'user_type' })
  user_type: string;

  @Column({ default: true })
  status: boolean;

  @Column({ default: 'active' })
  event_type: string;

  @Column({ type: 'text' })
  image: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approval: ApprovalStatus;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => UserEvent, (userEvent) => userEvent.event)
  userEvents: UserEvent[];
}
