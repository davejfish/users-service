import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriverConfig, ApolloFederationDriver } from '@nestjs/apollo';
import { UsersModule } from './users/users.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { path: 'src/schema.gql', federation: 2 },
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
      introspection: true,
      }),
      UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
