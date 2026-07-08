// users/user.entity.ts
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')   // federation entity key
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;
}
