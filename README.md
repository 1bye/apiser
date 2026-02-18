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
