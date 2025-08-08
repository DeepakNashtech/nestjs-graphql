import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User as UserType } from '../user/user.types';
import { GraphQLAuthGuard } from './guards/graphql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../user/user.entity';
import { GraphQLContext } from './interfaces/graphql-context.interface';

@Injectable()
@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: GraphQLContext,
  ): Promise<LoginResponse> {
    const result = await this.authService.login({ email, password });
    
    return {
      message: result.message,
      access_token: result.access_token,
      user: result.data,
      statusCode: result.statusCode,
    };
  }

  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => LogoutResponse)
  async logout(@Context() context: GraphQLContext): Promise<LogoutResponse> {
    const token = context.token;
    const result = await this.authService.logout(token);
    
    return {
      message: result.message,
      statusCode: result.statusCode,
    };
  }

  @UseGuards(GraphQLAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}

// Response Types
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LoginResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  access_token?: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => Int)
  statusCode: number;
}

@ObjectType()
export class LogoutResponse {
  @Field()
  message: string;

  @Field(() => Int)
  statusCode: number;
}

