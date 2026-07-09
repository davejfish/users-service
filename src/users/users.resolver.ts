import { Query, Resolver } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./users.entity";


@Resolver()
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Query(() => [User])
    getUsers(): Promise<User[]> {
        return this.usersService.getUsers();
    }
}