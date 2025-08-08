import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { GraphQLContext } from '../interfaces/graphql-context.interface';

@Injectable()
export class GraphQLAuthAndRolesGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx: GraphQLContext = gqlContext.getContext();
    
    // 1. Authentication Check
    const token = this.extractTokenFromHeader(ctx.req);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Inject user and token into GraphQL context
    ctx.user = user;
    ctx.token = token;

    // 2. Authorization Check (Roles)
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization) return undefined;
    
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

