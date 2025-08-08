import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserEvent } from '../user-event/user-event.entity';
import { Session } from '../auth/session.entity';
import { Event } from '../event/event.entity';
import { User as UserType, PaginatedUsers } from './user.types';
import { CreateUserInput, UpdateUserInput, UserFilterInput, PaginationInput } from './user.inputs';
import { GraphQLAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GraphQLRolesGuard } from '../auth/guards/graphql-roles.guard';
import { GraphQLAuthAndRolesGuard } from '../auth/guards/auth-and-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as bcrypt from 'bcrypt';

@Resolver(() => UserType)
@Injectable()
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserEvent)
    private userEventRepository: Repository<UserEvent>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  // Public query - no authentication required
  @Query(() => UserType, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Admin only - requires authentication and admin role
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Query(() => PaginatedUsers)
  async users(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
  ): Promise<PaginatedUsers> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filter?.role) {
      queryBuilder.where('user.role = :role', { role: filter.role });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin only - requires authentication and admin role
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Query(() => UserType, { nullable: true })
  async userByEmail(@Args('email') email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Public mutation - no authentication required for user registration
  @Mutation(() => UserType)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    const user = this.userRepository.create({
      ...input,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  // Authenticated users can update their own profile, admins can update any profile
  @UseGuards(GraphQLAuthGuard, GraphQLRolesGuard)
  @Mutation(() => UserType)
  async updateUser(
    @Args('id', { type: () => ID }) id: number,
    @Args('input') input: UpdateUserInput,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    // Check if user is updating their own profile or is an admin
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new NotFoundException('You can only update your own profile');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, input);
    return this.userRepository.save(user);
  }

  // Admin only - requires authentication and admin role
  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => ID }) id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected > 0;
  }

  // Field Resolvers - require authentication to access sensitive data
  @UseGuards(GraphQLAuthGuard)
  @ResolveField(() => [UserEvent])
  async userEvents(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<UserEvent[]> {
    // Users can only see their own events, admins can see all
    if (currentUser.id !== user.id && currentUser.role !== 'admin') {
      return [];
    }

    return this.userEventRepository.find({
      where: { user: { id: user.id } },
      relations: ['event'],
    });
  }

  @UseGuards(GraphQLAuthAndRolesGuard)
  @Roles('admin')
  @ResolveField(() => [Session])
  async sessions(@Parent() user: User): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { user: { id: user.id } },
    });
  }

  @UseGuards(GraphQLAuthGuard)
  @ResolveField(() => [Event])
  async registeredEvents(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<Event[]> {
    // Users can only see their own registered events, admins can see all
    if (currentUser.id !== user.id && currentUser.role !== 'admin') {
      return [];
    }

    const userEvents = await this.userEventRepository.find({
      where: { user: { id: user.id } },
      relations: ['event'],
    });
    
    return userEvents.map(userEvent => userEvent.event);
  }
}

