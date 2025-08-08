import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserEvent } from '../user-event/user-event.types';
import { Session } from '../auth/session.types';
import { Event } from '../event/event.types';

@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  // Note: password field is intentionally excluded from GraphQL schema for security

  @Field()
  role: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field({ nullable: true })
  image?: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  @Field(() => [UserEvent])
  userEvents: UserEvent[];

  @Field(() => [Session])
  sessions: Session[];

  @Field(() => [Event])
  registeredEvents?: Event[];
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

