import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma-service/prisma.service";
import { User } from "./users.entity";


@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    async getUsers(): Promise<User[]> {
        const users = await this.prismaService.user.findMany({ where: { deletedAt: null }})
        if (users.length === 0) {
            throw new NotFoundException(`No users found`);
        }
        return users;
    }

    async getUserById(id: string): Promise<User> {
        const user = await this.prismaService.user.findUnique({ where: { id, deletedAt: null }});
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
}