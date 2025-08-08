import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { GraphQLContext } from '../interfaces/graphql-context.interface';

@Injectable()
export class GraphQLAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx: GraphQLContext = gqlContext.getContext();
    
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
    
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization) return undefined;
    
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

