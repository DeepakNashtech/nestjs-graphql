import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserEvent } from '../user-event/user-event.entity';
import { Session } from '../auth/session.entity';
import { Event } from '../event/event.entity';
import { UserResolver } from './user.resolver';
import { AuthModule } from 'src/auth/auth.module';
import { GraphQLAuthAndRolesGuard } from 'src/auth/guards/auth-and-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserEvent, Session, Event]),AuthModule
  ],
  providers: [UserResolver, GraphQLAuthAndRolesGuard],
  exports: [TypeOrmModule],
})
export class UserModule {}

