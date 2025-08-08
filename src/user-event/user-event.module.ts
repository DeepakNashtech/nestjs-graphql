import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEvent } from "./user-event.entity";
import { User } from "../user/user.entity";
import { Event } from "../event/event.entity";
import { UserEventResolver } from "./user-event.resolver";
import { AuthModule } from "src/auth/auth.module";
import { GraphQLAuthAndRolesGuard } from "src/auth/guards/auth-and-roles.guard";

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent, User, Event]), AuthModule],
  providers: [UserEventResolver, GraphQLAuthAndRolesGuard],
  exports: [TypeOrmModule],
})
export class UserEventModule {}
