import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Injectable, NotFoundException, ConflictException, ForbiddenException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEvent } from './user-event.entity';
import { User } from '../user/user.entity';
import { Event } from '../event/event.entity';
import { UserEvent as UserEventType } from './user-event.types';
import { RegisterUserToEventInput } from '../event/event.inputs';
import { PaginationInput } from '../user/user.inputs';
import { GraphQLAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GraphQLRolesGuard } from '../auth/guards/graphql-roles.guard';
import { GraphQLAuthAndRolesGuard } from '../auth/guards/auth-and-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApprovalStatus } from '../event/event.types';

@Resolver(() => UserEventType)
@Injectable()
export class UserEventResolver {
  constructor(
    @InjectRepository(UserEvent)
    private userEventRepository: Repository<UserEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  // Admin only - view specific user event
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Query(() => UserEventType, { nullable: true })
  async userEvent(@Args('id', { type: () => ID }) id: number): Promise<UserEvent | null> {
    return this.userEventRepository.findOne({
      where: { id },
      relations: ['user', 'event'],
    });
  }

  // Admin only - view all user events
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Query(() => [UserEventType])
  async userEvents(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<UserEvent[]> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    return this.userEventRepository.find({
      relations: ['user', 'event'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  // Authenticated users can view their own registrations
  @UseGuards(GraphQLAuthGuard)
  @Query(() => [UserEventType])
  async myEventRegistrations(
    @CurrentUser() currentUser: User,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<UserEvent[]> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    return this.userEventRepository.find({
      where: { user: { id: currentUser.id } },
      relations: ['user', 'event'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  // Authenticated mutation - register for event
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => UserEventType)
  async registerUserToEvent(
    @Args('input') input: RegisterUserToEventInput,
    @CurrentUser() currentUser: User,
  ): Promise<UserEvent> {
    // Users can only register themselves, admins can register anyone
    if (input.user_id !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only register yourself for events');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: input.user_id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${input.user_id} not found`);
    }

    // Check if event exists and is approved
    const event = await this.eventRepository.findOne({
      where: { 
        id: input.event_id,
        status: true,
        approval: ApprovalStatus.APPROVED 
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${input.event_id} not found or not approved`);
    }

    // Check if user is already registered for this event
    const existingRegistration = await this.userEventRepository.findOne({
      where: {
        user: { id: input.user_id },
        event: { id: input.event_id },
      },
    });

    if (existingRegistration) {
      throw new ConflictException('User is already registered for this event');
    }

    // Create new registration
    const userEvent = this.userEventRepository.create({
      user,
      event,
      registered_at: new Date(),
    });

    return this.userEventRepository.save(userEvent);
  }

  // Authenticated mutation - unregister from event
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => Boolean)
  async unregisterUserFromEvent(
    @Args('userId', { type: () => ID }) userId: number,
    @Args('eventId', { type: () => ID }) eventId: number,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    // Users can only unregister themselves, admins can unregister anyone
    if (userId !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only unregister yourself from events');
    }

    const userEvent = await this.userEventRepository.findOne({
      where: {
        user: { id: userId },
        event: { id: eventId },
      },
    });

    if (!userEvent) {
      throw new NotFoundException('Registration not found');
    }

    const result = await this.userEventRepository.delete(userEvent.id);
    return result.affected > 0;
  }

  // Authenticated mutation - unregister from my event
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => Boolean)
  async unregisterFromEvent(
    @Args('eventId', { type: () => ID }) eventId: number,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    const userEvent = await this.userEventRepository.findOne({
      where: {
        user: { id: currentUser.id },
        event: { id: eventId },
      },
    });

    if (!userEvent) {
      throw new NotFoundException('You are not registered for this event');
    }

    const result = await this.userEventRepository.delete(userEvent.id);
    return result.affected > 0;
  }

  // Field Resolvers
  @ResolveField(() => User)
  async user(@Parent() userEvent: UserEvent): Promise<User> {
    if (userEvent.user) {
      return userEvent.user;
    }
    
    return this.userRepository.findOne({
      where: { id: userEvent.user.id },
    });
  }

  @ResolveField(() => Event)
  async event(@Parent() userEvent: UserEvent): Promise<Event> {
    if (userEvent.event) {
      return userEvent.event;
    }
    
    return this.eventRepository.findOne({
      where: { id: userEvent.event.id },
    });
  }
}

