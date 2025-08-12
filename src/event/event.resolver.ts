import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Injectable, NotFoundException, ForbiddenException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { UserEvent } from '../user-event/user-event.entity';
import { User } from '../user/user.entity';
import { Event as EventType, PaginatedEvents, ApprovalStatus } from './event.types';
import { CreateEventInput, UpdateEventInput, EventFilterInput } from './event.inputs';
import { PaginationInput } from '../user/user.inputs';
import { GraphQLAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GraphQLRolesGuard } from '../auth/guards/graphql-roles.guard';
import { GraphQLAuthAndRolesGuard } from '../auth/guards/auth-and-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => EventType)
@Injectable()
export class EventResolver {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEvent)
    private userEventRepository: Repository<UserEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Public query - no authentication required
  @Query(() => EventType, { nullable: true })
  async event(@Args('id', { type: () => ID }) id: number): Promise<Event | null> {
    return this.eventRepository.findOne({ 
      where: { id, status: true, approval: ApprovalStatus.APPROVED } 
    });
  }

  // Public query - only shows approved and active events
  @Query(() => PaginatedEvents)
  async events(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: EventFilterInput,
  ): Promise<PaginatedEvents> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository.createQueryBuilder('event')
      .where('event.status = :status', { status: true })
      .andWhere('event.approval = :approval', { approval: ApprovalStatus.APPROVED });

    if (filter?.trending !== undefined) {
      queryBuilder.andWhere('event.trending = :trending', { trending: filter.trending });
    }

    if (filter?.event_type) {
      queryBuilder.andWhere('event.event_type = :event_type', { event_type: filter.event_type });
    }

    if (filter?.user_type) {
      queryBuilder.andWhere('event.user_type = :user_type', { user_type: filter.user_type });
    }

    const [events, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin query - shows all events regardless of status
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Query(() => PaginatedEvents)
  async allEvents(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: EventFilterInput,
  ): Promise<PaginatedEvents> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    if (filter?.trending !== undefined) {
      queryBuilder.andWhere('event.trending = :trending', { trending: filter.trending });
    }

    if (filter?.status !== undefined) {
      queryBuilder.andWhere('event.status = :status', { status: filter.status });
    }

    if (filter?.approval) {
      queryBuilder.andWhere('event.approval = :approval', { approval: filter.approval });
    }

    if (filter?.event_type) {
      queryBuilder.andWhere('event.event_type = :event_type', { event_type: filter.event_type });
    }

    if (filter?.user_type) {
      queryBuilder.andWhere('event.user_type = :user_type', { user_type: filter.user_type });
    }

    const [events, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Public query - trending events
  @Query(() => PaginatedEvents)
  async trendingEvents(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PaginatedEvents> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await this.eventRepository.findAndCount({
      where: { 
        trending: true, 
        status: true, 
        approval: ApprovalStatus.APPROVED 
      },
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Authenticated query - user's registered events
  @UseGuards(GraphQLAuthGuard)
  @Query(() => PaginatedEvents)
  async userRegisteredEvents(
    @Args('userId', { type: () => ID }) userId: number,
    @CurrentUser() currentUser: User,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PaginatedEvents> {
    // Users can only see their own registered events, admins can see all
    if (currentUser.id !== Number(userId) && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only view your own registered events');
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const userEvents = await this.userEventRepository.find({
      where: { user: { id: userId } },
      relations: ['event'],
      skip,
      take: limit,
    });

    const total = await this.userEventRepository.count({
      where: { user: { id: userId } },
    });

    const events = userEvents.map(userEvent => userEvent.event);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Authenticated mutation - create event
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => EventType)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @CurrentUser() currentUser: User,
  ): Promise<Event> {
    // Set the user_id to the current authenticated user
    const eventData = {
      ...input,
      user_id: currentUser.id,
    };

    const event = this.eventRepository.create(eventData);
    return this.eventRepository.save(event);
  }

  // Authenticated mutation - update event (owner or admin only)
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => EventType)
  async updateEvent(
    @Args('id', { type: () => ID }) id: number,
    @Args('input') input: UpdateEventInput,
    @CurrentUser() currentUser: User,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user owns the event or is an admin
    if (event.user_id !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only update your own events');
    }

    Object.assign(event, input);
    return this.eventRepository.save(event);
  }

  // Admin or owner only - delete event
  @UseGuards(GraphQLAuthGuard)
  @Mutation(() => Boolean)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Check if user owns the event or is an admin
    if (event.user_id !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own events');
    }

    const result = await this.eventRepository.delete(id);
    return result.affected > 0;
  }

  // Admin only - approve event
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Mutation(() => EventType)
  async approveEvent(@Args('id', { type: () => ID }) id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    event.approval = ApprovalStatus.APPROVED;
    return this.eventRepository.save(event);
  }

  // Admin only - reject event
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Mutation(() => EventType)
  async rejectEvent(@Args('id', { type: () => ID }) id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    event.approval = ApprovalStatus.REJECTED;
    return this.eventRepository.save(event);
  }

  // Field Resolvers
  @ResolveField(() => [UserEvent])
  async userEvents(@Parent() event: Event): Promise<UserEvent[]> {
    return this.userEventRepository.find({
      where: { event: { id: event.id } },
      relations: ['user'],
    });
  }

  @ResolveField(() => [User])
  async registeredUsers(@Parent() event: Event): Promise<User[]> {
    const userEvents = await this.userEventRepository.find({
      where: { event: { id: event.id } },
      relations: ['user'],
    });
    
    return userEvents.map(userEvent => userEvent.user);
  }
}

