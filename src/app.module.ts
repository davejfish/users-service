import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriverConfig, ApolloFederationDriver } from '@nestjs/apollo';
import { UsersModule } from './users/users.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { PrismaModule } from './prisma-service/prisma.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { path: 'src/schema.gql', federation: 2 },
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
      introspection: true,
      }),
      UsersModule,
      PrismaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
