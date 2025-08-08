import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from '../interfaces/graphql-context.interface';
import { User } from '../../user/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx: GraphQLContext = gqlContext.getContext();
    
    return ctx.user;
  },
);

