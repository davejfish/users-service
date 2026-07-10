# Prisma 7 + NestJS + Apollo Federation — Setup Notes

Hard-won config for getting a NestJS code-first subgraph running on Prisma 7's new
`prisma-client` generator. These are the non-obvious gotchas — reuse them when building
the posts/comments subgraph.

## The core tension

Prisma 7's new `prisma-client` generator is **ESM-first** (uses `import.meta.url`), but
NestJS is **CommonJS**. Left unfixed you get `ReferenceError: exports is not defined in ES
module scope`. The fix is to force Prisma to emit CommonJS so it matches Nest — do NOT try
to convert Nest to ESM (decorators + ESM is a minefield).

## 1. Prisma generator — force CommonJS

`prisma/schema.prisma`:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  runtime      = "nodejs"
  moduleFormat = "cjs"      // <-- critical: matches NestJS's CommonJS
}
```

Run `npx prisma generate` after changing this.

## 2. tsconfig — classic CommonJS, NOT nodenext

NestJS defaults. If the Prisma init nudged you to `nodenext`, revert:

```jsonc
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    // do NOT set resolvePackageJsonExports (only valid with node16/nodenext/bundler)
  },
  "ts-node": {
    "experimentalResolver": true   // lets ts-node map the client's .js imports -> .ts (for seeding)
  }
}
```

## 3. Driver adapter required everywhere the client is instantiated

Prisma 7 requires a driver adapter (there's no built-in query engine binary). Install:

```bash
npm install @prisma/adapter-pg @as-integrations/express5
```

- `@prisma/adapter-pg` — the Postgres driver adapter
- `@as-integrations/express5` — required by Apollo Server 5 on Express 5 (NestJS 11)

Instantiate the client WITH the adapter (in `PrismaService` AND `prisma/seed.ts`):

```ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";   // <-- bare specifier! not the node_modules/...mjs path

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ["query", "warn", "error"] });
```

> Gotcha: IDE auto-import may resolve `PrismaPg` to
> `node_modules/@prisma/adapter-pg/dist/index.mjs`. Always use the bare `@prisma/adapter-pg`.

## 4. Load .env in the app (Nest does NOT do this automatically)

Without this, `process.env.DATABASE_URL` is `undefined` at runtime and the pg adapter throws
`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`.

First line of `src/main.ts`, before AppModule is imported:

```ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
```

(Also loads `PORT` from `.env`.) A cleaner long-term option is `@nestjs/config`.

## 5. GraphQL federation module

`app.module.ts`:

```ts
GraphQLModule.forRoot<ApolloFederationDriverConfig>({
  driver: ApolloFederationDriver,
  autoSchemaFile: { path: 'src/schema.gql', federation: 2 },
  playground: false,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],  // Apollo Sandbox
})
```

- Schema is generated **at app startup** (not a build step). A type only appears in
  `schema.gql` if it's reachable from a `@Query`/`@Mutation`.
- The `@key` directive does NOT show in `schema.gql`; it appears in the served federation SDL
  (`{ _service { sdl } }`).

## 6. Making a type a federation entity

Entity: `@Directive('@key(fields: "id")')` on the `@ObjectType`.
Resolver: `@Resolver(() => User)` (the type arg is required for `@ResolveReference`), plus:

```ts
@ResolveReference()
resolveReference(ref: { __typename: string; id: string }): Promise<User> {
  return this.usersService.getUserById(ref.id);
}
```

> Note: `getUserById` throws `NotFoundException` on a missing id. For a reference resolver,
> consider returning `null` instead so a dangling cross-subgraph reference doesn't fail the
> whole gateway response.

Nullable Prisma fields (`DateTime?`) MUST be `@Field(..., { nullable: true })` on the entity,
or querying a row with a null value throws "Cannot return null for non-nullable field".

## 7. Local database (Docker) + seed

`docker compose up -d` (Postgres on 5432). `.env`:

```
DATABASE_URL="postgresql://users:users@localhost:5432/users?schema=public"
```

Seed config lives in `prisma.config.ts` (Prisma 7), NOT package.json:

```ts
migrations: { path: "prisma/migrations", seed: "ts-node prisma/seed.ts" }
```

Run: `npm run prisma:seed`. Use `upsert` on a unique field to keep it idempotent.

## Verifying federation readiness

```bash
# @key present in served SDL:
curl -s localhost:3534/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ _service { sdl } }"}'

# reference resolution (the gateway's exact call):
curl -s localhost:3534/graphql -H 'Content-Type: application/json' \
  -d '{"query":"query($r:[_Any!]!){ _entities(representations:$r){ ... on User { id email } } }","variables":{"r":[{"__typename":"User","id":"<real-id>"}]}}'
```
