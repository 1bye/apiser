# Apiser

Collection of typed packages for backend/frontend application building.

## Packages (current focus)

### `@apisr/controller` — **WIP**
Use it to define typed handlers with payload validation, response shaping, bindings, and optional caching.

```ts
import { createHandler, createOptions } from "@apisr/controller";
import { z } from "@apisr/zod";

const options = createOptions({
  name: "user-controller",
});

const handler = createHandler(options);

const getUser = handler(
  async ({ payload }) => ({ id: payload.id, ok: true }),
  {
    payload: z.object({ id: z.number() }),
  }
);

const result = await getUser({ id: 1 });
```

Bindings + `fail()` (from `responseHandler`) example:

```ts
import { createHandler, createOptions } from "@apisr/controller";
import { createResponseHandler } from "@apisr/response";
import { z } from "@apisr/zod";

const responseHandler = createResponseHandler({
  error: {
    schema: z.object({
      name: z.string(),
      details: z.string(),
    }),
  },
}).defineError("user not found", ({ input }) => {
  return {
    name: "USER_NOT_FOUND",
    details: `User ${input.id} was not found`,
  }
}, {
  input: z.object({ id: z.number() }),
});

const options = createOptions({
  name: "user-controller",
  responseHandler,
  bindings: (bindings) => ({
    version: bindings.value("v1"),
    auth: bindings.bind(() => ({
      mode: "alwaysInjected",
      resolve: async () => ({ auth: { userId: 1 } }),
    })),
  }),
});

const handle = createHandler(options);

const getUser = handle(
  async ({ payload, auth, version, fail }) => {
    if (payload.id !== auth.userId) {
      throw fail("user not found", { id: payload.id });
    }

    return { id: payload.id, version };
  },
  {
    payload: z.object({ id: z.number() }),
  }
);
```

Advanced features (also **WIP**):

- Built-in cache support at global and per-handler level (`wrapHandler`, custom key strategy, custom store)
- Framework adapter for Elysia via `@apisr/controller/elysia`

```ts
import { createHandler, createOptions } from "@apisr/controller";
import { elysia } from "@apisr/controller/elysia";
import { KeyvStore } from "@apisr/controller/cache/keyv";
import { z } from "@apisr/zod";
import Keyv from "keyv";

const store = new KeyvStore(new Keyv());

const options = createOptions({
  name: "users",
  cache: {
    store,
    wrapHandler: true,
    key: ({ payload }) => ["users", String((payload as { id: number }).id)],
  },
});

const handle = createHandler(options);

export const getUser = handle(async ({ payload, cache }) => {
  const id = payload.id;

  return await cache(["user", String(id)], async () => {
    return { id, name: `user-${id}` };
  }, { 
    ttl: 60_000 
  });
}, {
  payload: z.object({ id: z.number() }),
});

// Elysia integration
app.get("/users/:id", ...elysia(getUser));
```

### `@apisr/drizzle-model` — **Alpha**
Use it to build typed model helpers on top of Drizzle schema + DB + relations.

```ts
import { modelBuilder } from "@apisr/drizzle-model";

const model = modelBuilder({
  db,
  schema,
  relations,
  dialect: "PostgreSQL",
});

const userModel = model("user", {});
const users = await userModel.where({ name: "Alex" }).findMany();
```

More operations (filters, insert, update, delete, upsert):

```ts
import { esc } from "@apisr/drizzle-model";

const userModel = model("user", {});
const postsModel = model("userPosts", {});

const adults = await userModel
  .where({
    name: { like: esc("A%") },
    age: { gte: esc(18) },
  })
  .findMany();

const [createdPost] = await postsModel
  .insert({
    title: "Hello world",
    userId: 1,
    featured: true,
  })
  .return();

const [updatedPost] = await postsModel
  .where({ id: esc(createdPost.id) })
  .update({ title: "Updated title" })
  .return();

await postsModel.where({ 
  id: esc(createdPost.id),
  name: {
    like: "A%"
  }
}).delete().return();

const [user] = await userModel
  .upsert({
    insert: {
      name: "Alex",
      email: "alex@example.com",
      age: 20,
      isVerified: false,
    },
    update: { name: "Alex Updated" },
    target: schema.user.email, // optional
  })
  .return();
```

### `@apisr/logger` — **WIP**
Use it for structured logs with typed transports, scoped routing (`to`), and flushing.

```ts
import { createLogger, createTransport } from "@apisr/logger";

const consoleTransport = createTransport({
  log: ({ level, message }) => console.log(level, message),
});

const logger = createLogger({
  name: "app",
  transports: { console: consoleTransport },
});

logger.info("started");
```

### `@apisr/response` — **WIP**
Use it to create typed response handlers (`json`, `text`, `binary`) and domain errors.

```ts
import { createResponseHandler } from "@apisr/response";
import { z } from "@apisr/zod";

const response = createResponseHandler((options) => ({
  json: options.json({
    schema: z.object({ msg: z.string() }),
  }),
})).defineError("NOT_FOUND", {
  name: "NOT_FOUND",
  details: "Entity was not found",
});

const ok = response.json({ msg: "hello" });
```

### `@apisr/transform` — **WIP**
Use it to define tag registries and map data across provider/domain shapes via shared semantic fields.

```ts
import { collection } from "@apisr/transform/collection";
import { registry } from "@apisr/transform/registry";

const tags = registry((tag) => ({
  "customer.email": tag.string().required(),
}));

const Customer = collection({
  "CRM.Customer": { email: tags("customer.email") },
  "Shop.Customer": { email: tags("customer.email") },
});

const payload = {
  email: "alex@example.com",
};

const { value: shopCustomer, errors, explain } = Customer.transform(payload, {
  from: "CRM.Customer",
  to: "Shop.Customer",
  explain: true,
  mode: "strict", // or "warn" | "loose"
});

console.log(shopCustomer);
```

### `@apisr/schema` — **WIP**
Use it as a schema bridge/inference layer (currently Zod-focused) with runtime validation helpers.

```ts
import { checkSchema, type Infer } from "@apisr/schema";
import { z } from "@apisr/zod";

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = Infer<typeof userSchema>;
const user = checkSchema(userSchema, { name: "Alex", age: 20 }) as User;
```
