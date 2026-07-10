import { Args, ID, Query, ResolveReference, Resolver } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./users.entity";


@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Query(() => [User])
    getUsers(): Promise<User[]> {
        return this.usersService.getUsers();
    }

    @Query(() => User)
    getUserById(@Args('id', { type: () => ID }) id: string): Promise<User> {
        return this.usersService.getUserById(id);
    }

    @ResolveReference()
    resolveReference(ref: { __typename: string; id: string }): Promise<User> {
        return this.usersService.getUserById(ref.id);
    }
}
