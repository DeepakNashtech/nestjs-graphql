import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/user.types';

@ObjectType()
export class Session {
  @Field(() => ID)
  id: number;

  // Note: token field is intentionally excluded from GraphQL schema for security

  @Field(() => User)
  user: User;

  @Field()
  expiresAt: Date;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

