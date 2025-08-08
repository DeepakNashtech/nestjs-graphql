import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/user.types';
import { Event } from '../event/event.types';

@ObjectType()
export class UserEvent {
  @Field(() => ID)
  id: number;

  @Field(() => User)
  user: User;

  @Field(() => Event)
  event: Event;

  @Field()
  registered_at: Date;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

