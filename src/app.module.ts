import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";

// Entity imports
import { User } from "./user/user.entity";
import { Event } from "./event/event.entity";
import { UserEvent } from "./user-event/user-event.entity";
import { Session } from "./auth/session.entity";

// Module imports
import { UserModule } from "./user/user.module";
import { EventModule } from "./event/event.module";
import { UserEventModule } from "./user-event/user-event.module";
import { AuthModule } from "./auth/auth.module";

// GraphQL Context Interface
import { GraphQLContext } from "./auth/interfaces/graphql-context.interface";

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // GraphQL Configuration with Context
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }): GraphQLContext => ({
        req,
        res,
        // user and token will be injected by guards
      }),
      formatError: (error) => {
        console.error("GraphQL Error:", error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
      // CORS should be configured in main.ts, not here
    }),

    // TypeORM Configuration
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_NAME || "event_management",
      entities: [User, Event, UserEvent, Session],
      synchronize: process.env.NODE_ENV !== "production", // Only for development
      logging: process.env.NODE_ENV === "development",
      ssl: { rejectUnauthorized: false } ,
    }),

    // Feature Modules
    AuthModule,
    UserModule,
    EventModule,
    UserEventModule,
  ],
})
export class AppModule {}
