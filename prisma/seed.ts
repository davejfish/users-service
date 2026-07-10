import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const users = [
  { email: "ada@example.com", firstName: "Ada", lastName: "Lovelace" },
  { email: "alan@example.com", firstName: "Alan", lastName: "Turing" },
  { email: "grace@example.com", firstName: "Grace", lastName: "Hopper" },
  { email: "linus@example.com", firstName: "Linus", lastName: "Torvalds" },
  { email: "margaret@example.com", firstName: "Margaret", lastName: "Hamilton" },
];

async function main() {
  for (const user of users) {
    // upsert on the unique email keeps the seed idempotent (safe to re-run)
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`  ✓ ${record.firstName} ${record.lastName} <${record.email}> (${record.id})`);
  }
}

main()
  .then(() => console.log(`Seeded ${users.length} users.`))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
