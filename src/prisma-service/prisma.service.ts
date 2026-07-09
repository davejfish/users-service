import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "generated/prisma/client";
import { PrismaPg } from "node_modules/@prisma/adapter-pg/dist/index.mjs";


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super({ adapter, log: ['query', 'info', 'warn', 'error'] });
    }

    async onModuleInit() {
        await this.$connect();
    }
}