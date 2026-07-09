// users/user.entity.ts
import { ObjectType, Field, ID, Directive, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")') // federation entity key
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
