import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { GraphQLAuthGuard } from './guards/graphql-auth.guard';
import { GraphQLRolesGuard } from './guards/graphql-roles.guard';
import { GraphQLAuthAndRolesGuard } from './guards/auth-and-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, User]),
  ],
  providers: [
    AuthService,
    AuthResolver,
    GraphQLAuthGuard,
    GraphQLRolesGuard,
    GraphQLAuthAndRolesGuard,
  ],
  exports: [
    AuthService,
    GraphQLAuthGuard,
    GraphQLRolesGuard,
    GraphQLAuthAndRolesGuard,
    TypeOrmModule,
  ],
})
export class AuthModule {}

