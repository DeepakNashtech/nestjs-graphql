import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { UserEvent } from '../user-event/user-event.entity';
import { User } from '../user/user.entity';
import { EventResolver } from './event.resolver';
import { AuthModule } from '../auth/auth.module';
import { GraphQLAuthAndRolesGuard } from 'src/auth/guards/auth-and-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, UserEvent, User]), AuthModule
  ],
  providers: [EventResolver, GraphQLAuthAndRolesGuard],
  exports: [TypeOrmModule],
})
export class EventModule {}

