# @apisr/drizzle-model

> **⚠️ This package is on high development stage! May have bugs**  

> **⚠️ Requires `drizzle-orm@beta`**  
> This package is built for Drizzle ORM beta versions (`^1.0.0-beta.2-86f844e`).  

Type-safe, chainable model runtime for **Drizzle ORM**.

Build reusable models for tables and relations with a progressive flow:

1. **Intent Stage** — declare what you want (`where`, `insert`, `update`, ...)
2. **Execution Stage** — choose execution (`findMany`, `findFirst`, `return`, `returnFirst`)
3. **Refinement Stage** — shape result (`select`, `exclude`, `with`, `raw`)
4. **Programmatic Polishing** — post-process safely (`omit`, `safe`)

---

## Learning Path (easy → advanced)

1. [Install and create your first model](#install-and-first-model)
2. [Basic reads](#basic-reads)
3. [Basic writes](#basic-writes)
4. [Result refinement](#result-refinement)
5. [Error-safe execution](#error-safe-execution)
6. [Advanced: model options and extension](#advanced-model-options-and-extension)
7. [Full API reference](#full-api-reference)

---

## Install and first model

```bash
bun add @apisr/drizzle-model drizzle-orm@beta
```

```ts
import { modelBuilder, esc } from "@apisr/drizzle-model";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { relations } from "./relations";

const db = drizzle(process.env.DATABASE_URL!, { schema, relations });

const model = modelBuilder({
  db,
  schema,
  // requires DrizzleORM relations v2. See: https://orm.drizzle.team/docs/relations-v1-v2
  relations,
  dialect: "PostgreSQL",
});

const userModel = model("user", {});
```

> `drizzle-orm` is a peer dependency.

---

## Basic reads

### Find one

```ts
const user = await userModel.findFirst();
```

### Find many with filter

```ts
const users = await userModel
  .where({ name: esc("Alex") })
  .findMany();
```

### Count

```ts
const total = await userModel.count();
const verified = await userModel.where({ isVerified: esc(true) }).count();
```

---

## Basic writes

### Insert

```ts
await userModel.insert({
  name: "New User",
  email: "new@example.com",
  age: 18,
});
```

### Update

```ts
const updated = await userModel
  .where({ id: esc(1) })
  .update({ name: "Updated" })
  .returnFirst();
```

### Delete

```ts
await userModel.where({ id: esc(2) }).delete();
```

### Upsert

```ts
const row = await userModel
  .upsert({
    insert: { name: "Alex", email: "alex@ex.com", age: 20 },
    update: { name: "Alex Updated" },
    target: schema.user.email,
  })
  .returnFirst();
```

---

## Result refinement

### Query-side refinement (`findMany` / `findFirst` result)

#### Loading relations with `.with()`

```ts
// Load related posts for each user
const users = await userModel
  .findMany()
  .with({ posts: true });

// Nested relations
const users = await userModel
  .findMany()
  .with({
    posts: {
      comments: true,
    },
  });

// Multiple relations
const users = await userModel
  .findMany()
  .with({
    posts: true,
    invitee: true,
  });

// Query `where` relations
const users = await userModel
  .findMany()
  .with({
    posts: postModel.where({
      title: {
        like: "New%"
      }
    }),
  });
```

#### Using `.include()` for type-safe relation values

`.include()` is a helper that returns the relation value as-is, used for type-level relation selection:

```ts
// Pass to .with()
const users = await userModel.findMany().with({
  posts: postModel.where({
    title: {
      like: "New%"
    }
  }).include({
    comments: true
  })
});
```

#### Combining refiners

```ts
const users = await userModel
  .findMany()
  .with({ posts: true })
  .select({ id: true, name: true, email: true })
  .exclude({ email: true });
```

Available query refiners:

- `.with(relations)` — load related entities
- `.select(fields)` — pick specific fields
- `.exclude(fields)` — omit specific fields
- `.raw()` — skip format function
- `.safe()` — wrap in `{ data, error }`
- `.debug()` — inspect query state

### Mutation-side refinement (`insert` / `update` / `delete` / `upsert` result)

```ts
const rows = await userModel
  .insert({ email: "a@b.com", name: "Alex", age: 20 })
  .return();

const first = await userModel
  .insert({ email: "b@b.com", name: "Anna", age: 21 })
  .returnFirst();

const sanitized = await userModel
  .where({ id: esc(1) })
  .update({ secretField: 999 })
  .returnFirst()
  .omit({ secretField: true });
```

Available mutation refiners:

- `.return(fields?)`
- `.returnFirst(fields?)`
- `.omit(fields)`
- `.safe()`

---

## Error-safe execution

Use `.safe()` when you prefer a result object instead of throw/reject behavior.

```ts
const result = await userModel.findMany().safe();

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

Shape:

```ts
type SafeResult<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: unknown };
```

---

## Advanced: model options and extension

### `format`

```ts
const userModel = model("user", {
  format(row) {
    const { secretField, ...rest } = row;
    return {
      ...rest,
      isVerified: Boolean(rest.isVerified),
    };
  },
});
```

Use `.raw()` to bypass format.

### Default `where`

```ts
const activeUsers = model("user", {
  where: { isVerified: esc(true) },
});
```

### Custom `methods`

```ts
const userModel = model("user", {
  methods: {
    async byEmail(email: string) {
      return await userModel.where({ email: esc(email) }).findFirst();
    },
  },
});
```

### `extend()` and `db()`

```ts
const extended = userModel.extend({
  methods: {
    async adults() {
      return await userModel.where({ age: { gte: esc(18) } }).findMany();
    },
  },
});

const txUserModel = userModel.db(db);
```

Note: when method names conflict during `extend`, existing runtime methods take precedence over newly passed ones.

---

## Full API reference

### Model-level methods

- Query/lifecycle:
  - `where(value)`
  - `findMany()`
  - `findFirst()`
  - `count()`
  - `include(value)`
  - `extend(options)`
  - `db(dbInstance)`
- Mutations:
  - `insert(value)`
  - `update(value)`
  - `delete()`
  - `upsert(value)`

### Query result methods

- `.with(...)`
- `.select(...)`
- `.exclude(...)`
- `.raw()`
- `.safe()`
- `.debug()`

### Mutation result methods

- `.return(...)`
- `.returnFirst(...)`
- `.omit(...)`
- `.safe()`

---

## Dialect notes

- Dialects with native `.returning()` use it for mutation return pipelines.
- Dialects with ID-only return paths may use dialect-specific fallback behavior.
- Upsert uses `onConflictDoUpdate` when supported.

---

## Type safety notes

- Prefer `esc(...)` for explicit where value/operator expressions.
- `.select()` and `.exclude()` refine result types.
- `.safe()` wraps result types into `{ data, error }`.
- `.return()` returns array shape; `.returnFirst()` returns single-row shape.

---

## Testing

Comprehensive tests are available in `tests/base`:

- `find.test.ts`
- `insert.test.ts`
- `update.test.ts`
- `delete.test.ts`
- `upsert.test.ts`
- `count.test.ts`
- `safe.test.ts`

Run all base tests:

```bash
bun test base
```

---

## Troubleshooting

### `safe()` returns `{ data: undefined, error }`

The underlying operation throws. Re-run without `.safe()` to inspect the raw stack.

### `.return()` result shape surprises

- `.return()` => array
- `.returnFirst()` => single object
- no return chain => dialect/default execution behavior

### Relation loading with `.with(...)`

Ensure relation metadata is defined with Drizzle `defineRelations` and passed to `modelBuilder({ relations })`.

---

## License

MIT (follow repository root license if different).
