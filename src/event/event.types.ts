import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { UserEvent } from '../user-event/user-event.types';
import { User } from '../user/user.types';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(ApprovalStatus, {
  name: 'ApprovalStatus',
});

@ObjectType()
export class Event {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  user_id: number;

  @Field()
  event_name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  location: string;

  @Field()
  trending: boolean;

  @Field(() => Float)
  registration_fee: number;

  @Field()
  event_start_date: Date;

  @Field()
  event_end_date: Date;

  @Field()
  description: string;

  @Field()
  user_type: string;

  @Field()
  status: boolean;

  @Field()
  event_type: string;

  @Field()
  image: string;

  @Field(() => ApprovalStatus)
  approval: ApprovalStatus;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  @Field(() => [UserEvent])
  userEvents: UserEvent[];

  @Field(() => [User])
  registeredUsers?: User[];
}

@ObjectType()
export class PaginatedEvents {
  @Field(() => [Event])
  events: Event[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

