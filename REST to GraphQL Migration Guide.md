# REST to GraphQL Migration Guide

## Overview

This guide will help you migrate your existing NestJS REST API with PostgreSQL to GraphQL. The migration maintains all existing functionality while providing the benefits of GraphQL such as flexible queries, type safety, and efficient data fetching.

## Prerequisites

Before starting the migration, ensure you have:
- Node.js (v16 or higher)
- PostgreSQL database
- Existing NestJS application with TypeORM entities

## Installation

### 1. Install Required Dependencies

```bash
npm install @nestjs/graphql @nestjs/apollo apollo-server-express graphql class-validator class-transformer bcrypt
```

### 2. Install Development Dependencies

```bash
npm install --save-dev @types/bcrypt
```

## File Structure

After migration, your project structure should look like this:

```
src/
├── user/
│   ├── user.entity.ts          # Existing TypeORM entity
│   ├── user.types.ts           # New GraphQL types
│   ├── user.inputs.ts          # New GraphQL input types
│   ├── user.resolver.ts        # New GraphQL resolver
│   └── user.module.ts          # Updated module
├── event/
│   ├── event.entity.ts         # Existing TypeORM entity
│   ├── event.types.ts          # New GraphQL types
│   ├── event.inputs.ts         # New GraphQL input types
│   ├── event.resolver.ts       # New GraphQL resolver
│   └── event.module.ts         # Updated module
├── user-event/
│   ├── user-event.entity.ts    # Existing TypeORM entity
│   ├── user-event.types.ts     # New GraphQL types
│   ├── user-event.resolver.ts  # New GraphQL resolver
│   └── user-event.module.ts    # Updated module
├── app.module.ts               # Updated with GraphQL configuration
└── schema.gql                  # Auto-generated GraphQL schema
```

## Migration Steps

### Step 1: Update App Module

Replace your existing `app.module.ts` with the provided configuration that includes GraphQL setup.

### Step 2: Create GraphQL Types

For each entity, create corresponding GraphQL types:
- `*.types.ts` - Define GraphQL object types
- `*.inputs.ts` - Define input types for mutations

### Step 3: Create Resolvers

Create resolvers for each entity that handle:
- Queries (read operations)
- Mutations (create, update, delete operations)
- Field resolvers (for nested data)

### Step 4: Update Modules

Update your feature modules to include the new resolvers.

### Step 5: Environment Configuration

Ensure your environment variables are properly configured:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=event_management
NODE_ENV=development
```

## Key Features Implemented

### 1. Comprehensive Queries
- Single entity queries (`user`, `event`, `userEvent`)
- Paginated list queries with filtering
- Relationship queries (nested data fetching)

### 2. Mutations
- CRUD operations for all entities
- User registration to events
- Event approval/rejection workflows

### 3. Advanced Features
- Input validation using class-validator
- Password hashing for user creation
- Pagination support
- Filtering capabilities
- Error handling

### 4. Type Safety
- Full TypeScript support
- GraphQL schema auto-generation
- Input/output type validation

## GraphQL Playground

Once your application is running, you can access the GraphQL Playground at:
```
http://localhost:3000/graphql
```

## Example Queries

### Get User with Events
```graphql
query GetUserWithEvents($id: ID!) {
  user(id: $id) {
    id
    name
    email
    registeredEvents {
      id
      event_name
      event_start_date
      location
    }
  }
}
```

### Get Paginated Events with Filters
```graphql
query GetEvents($pagination: PaginationInput, $filter: EventFilterInput) {
  events(pagination: $pagination, filter: $filter) {
    events {
      id
      event_name
      trending
      approval
      registeredUsers {
        id
        name
        email
      }
    }
    total
    page
    totalPages
  }
}
```

### Create New Event
```graphql
mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    event_name
    approval
    created_at
  }
}
```

### Register User to Event
```graphql
mutation RegisterUser($input: RegisterUserToEventInput!) {
  registerUserToEvent(input: $input) {
    id
    registered_at
    user {
      name
      email
    }
    event {
      event_name
      location
    }
  }
}
```

## Migration Benefits

### 1. Flexible Data Fetching
- Clients can request exactly the data they need
- Reduces over-fetching and under-fetching
- Single endpoint for all operations

### 2. Strong Type System
- Compile-time type checking
- Auto-generated documentation
- Better developer experience

### 3. Real-time Capabilities
- Built-in subscription support (can be extended)
- Live data updates

### 4. Introspection
- Self-documenting API
- Automatic schema generation
- GraphQL Playground for testing

## Performance Considerations

### 1. N+1 Query Problem
The resolvers include proper relationship loading to avoid N+1 queries:
```typescript
@ResolveField(() => [Event])
async registeredEvents(@Parent() user: User): Promise<Event[]> {
  // Efficient query with proper joins
  const userEvents = await this.userEventRepository.find({
    where: { user: { id: user.id } },
    relations: ['event'],
  });
  return userEvents.map(userEvent => userEvent.event);
}
```

### 2. Pagination
All list queries support pagination to handle large datasets efficiently.

### 3. Filtering
Query filters reduce the amount of data processed and transferred.

## Security Considerations

### 1. Input Validation
All inputs are validated using class-validator decorators.

### 2. Password Security
User passwords are hashed using bcrypt before storage.

### 3. Error Handling
Proper error handling prevents sensitive information leakage.

## Testing

### GraphQL Queries Testing
```typescript
// Example test for user resolver
describe('UserResolver', () => {
  it('should return user by id', async () => {
    const result = await resolver.user(1);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});
```

## Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm run start:prod
```

### 3. Environment Variables
Ensure all production environment variables are properly set.

## Troubleshooting

### Common Issues

1. **Schema Generation Errors**
   - Ensure all GraphQL decorators are properly imported
   - Check for circular dependencies

2. **Database Connection Issues**
   - Verify environment variables
   - Check PostgreSQL connection

3. **Resolver Errors**
   - Ensure proper repository injection
   - Check entity relationships

## Next Steps

After successful migration, consider:
1. Implementing authentication guards
2. Adding subscription support for real-time features
3. Implementing caching strategies
4. Adding comprehensive testing
5. Setting up monitoring and logging

## Support

For additional help with the migration:
1. Check the NestJS GraphQL documentation
2. Review Apollo Server documentation
3. Consult TypeORM documentation for database operations

