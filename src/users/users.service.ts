import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma-service/prisma.service";
import { User } from "./users.entity";


@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    async getUsers(): Promise<User[]> {
        const users = await this.prismaService.user.findMany({ where: { deletedAt: null }})
        return users;
    }
}