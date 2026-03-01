# @apisr/drizzle-model

> **⚠️ Development Status**  
> This package is in active development and **not recommended for production use yet**.  
> APIs may change between minor versions. Semantic versioning will be enforced after v1.0.0 stable release.

> **⚠️ Requires `drizzle-orm@beta`**  
> This package is built for Drizzle ORM beta versions (`^1.0.0-beta.2-86f844e`).  
> See [Compatibility](#compatibility) for details.  

Type-safe, chainable model runtime for **Drizzle ORM**.

Build reusable models for tables and relations with a progressive flow:

1. **Intent Stage** — declare what you want (`where`, `insert`, `update`, ...)
2. **Execution Stage** — choose execution (`findMany`, `findFirst`, `return`, `returnFirst`)
3. **Refinement Stage** — shape the SQL query (`select`, `exclude`, `with`)
4. **Programmatic Polishing** — post-process the result (`omit`, `raw`, `safe`)

---

## Philosophy

Drizzle ORM gives you low-level composable primitives.

`@apisr/drizzle-model` adds:

- **A model abstraction per table** — encapsulate table logic in reusable models
- **A progressive query pipeline** — build queries step-by-step with clear intent
- **A unified result-shaping layer** — consistent formatting and transformation
- **Safe execution flows** — error handling without try-catch boilerplate
- **Reusable business logic extensions** — custom methods and model composition

---

## Why not just use Drizzle directly?

Drizzle ORM is already type-safe and powerful.

`@apisr/drizzle-model` adds value when you need:

- **Reusable model abstraction per table** — define once, use everywhere
- **Chainable intent → execution flow** — progressive, readable query building
- **Built-in result shaping** — consistent formatting and field selection
- **Centralized formatting layer** — transform data in one place
- **Safer error pipelines** — `.safe()` for error-as-value patterns
- **Composable model extensions** — custom methods and model inheritance

### Quick Comparison

**Without drizzle-model:**
```ts
import { eq } from "drizzle-orm";

await db
  .select()
  .from(schema.user)
  .where(eq(schema.user.id, 1));
```

**With drizzle-model:**
```ts
await userModel.where({ id: esc(1) }).findFirst();
```

The difference becomes more apparent with:
- Consistent formatting across queries
- Reusable where conditions
- Nested relation loading
- Custom business logic methods

---

## Learning Path (easy → advanced)

1. [Install and create your first model](#install-and-first-model)
2. [Basic reads](#basic-reads)
3. [Basic writes](#basic-writes)
4. [Result refinement](#result-refinement)
5. [Error-safe execution](#error-safe-execution)
6. [Transactions](#transactions)
7. [Advanced: model options and extension](#advanced-model-options-and-extension)
8. [Performance considerations](#performance-considerations)
9. [Limitations](#limitations)
10. [Full API reference](#full-api-reference)
11. [Compatibility](#compatibility)

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

// Real-world example with formatting
const postModel = model("post", {
  format(row) {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
    };
  },
});
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
// ✅ Correct: use esc() for literal values
const users = await userModel
  .where({ name: esc("Alex") })
  .findMany();

// ❌ Wrong: plain values are not allowed
// const users = await userModel
//   .where({ name: "Alex" }) // Type error!
//   .findMany();
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

`.include()` is a helper that allows you to specify nested relations when using a model instance in `.with()`.

**Why it exists:**
- When you pass a model with `.where()` to `.with()`, you need a way to also load nested relations
- `.include()` preserves the model's where clause while adding relation loading
- It's purely type-level — it doesn't affect SQL directly, but enables type-safe nested relation selection

```ts
// Load posts with a filter AND their comments
const users = await userModel.findMany().with({
  posts: postModel.where({
    title: {
      like: "New%"
    }
  }).include({
    comments: true
  })
});

// Without .include(), you can only filter posts:
const users = await userModel.findMany().with({
  posts: postModel.where({ published: esc(true) })
});
```

#### SQL column selection with `.select()` and `.exclude()`

`.select()` and `.exclude()` control which columns appear in the SQL `SELECT` clause — they affect the query itself, not just the result.

```ts
// Only fetch id and name columns
const users = await userModel
  .findMany()
  .select({ id: true, name: true });

// Fetch all columns except email
const users = await userModel
  .findMany()
  .exclude({ email: true });

// Combine: start with a whitelist, then drop a field
const users = await userModel
  .findMany()
  .select({ id: true, name: true, email: true })
  .exclude({ email: true });
```

This is equivalent to:

```ts
db.select({ id: schema.user.id, name: schema.user.name }).from(schema.user);
```

#### Combining query refiners

```ts
const users = await userModel
  .findMany()
  .with({ posts: true })
  .select({ id: true, name: true });
```

Available query refiners:

- `.select(fields)` — SQL SELECT whitelist
- `.exclude(fields)` — SQL SELECT blacklist
- `.with(relations)` — load related entities via JOINs
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

// .omit() removes fields from the result AFTER the query runs (programmatic, not SQL)
const sanitized = await userModel
  .where({ id: esc(1) })
  .update({ secretField: 999 })
  .returnFirst()
  .omit({ secretField: true });
```

Available mutation refiners:

- `.return(fields?)` — return all rows
- `.returnFirst(fields?)` — return first row
- `.omit(fields)` — remove fields from result after query (programmatic, not SQL)
- `.safe()` — wrap in `{ data, error }`

### Edge case behavior

**What happens when `.findFirst()` returns nothing?**

```ts
const user = await userModel.where({ id: esc(999) }).findFirst();
// user is `undefined` if no row matches
```

**What does `.returnFirst()` return if no row was affected?**

```ts
const updated = await userModel
  .where({ id: esc(999) })
  .update({ name: "New" })
  .returnFirst();
// updated is `undefined` if no row was updated
```

**Return nullability:**
- `.findFirst()` → `T | undefined`
- `.findMany()` → `T[]` (empty array if no matches)
- `.returnFirst()` → `T | undefined`
- `.return()` → `T[]` (empty array if no rows affected)
- `.count()` → `number` (0 if no matches)

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

## Transactions

Use `.db()` to bind a model to a transaction instance:

```ts
await db.transaction(async (tx) => {
  const txUser = userModel.db(tx);
  const txPost = postModel.db(tx);
  
  const user = await txUser.insert({
    name: "Alice",
    email: "alice@example.com",
    age: 25,
  }).returnFirst();
  
  await txPost.insert({
    title: "First Post",
    content: "Hello world",
    authorId: user.id,
  });
});
```

The transaction-bound model uses the same API as the regular model.

---

## Advanced: model options and extension

### `format`

Transform every row returned from queries:

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

// Real-world example: date parsing and sanitization
const postModel = model("post", {
  format(row) {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      // Remove internal fields
      internalStatus: undefined,
    };
  },
});
```

Use `.raw()` to bypass format when needed:

```ts
const rawUser = await userModel.findFirst().raw();
// secretField is present, isVerified is original type
```

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

## Performance considerations

### Relation loading with `.with()`

- **No N+1 queries** — `.with()` uses JOIN-based loading, not separate queries per row
- **Deep nesting** may generate larger queries — use `.select()` to reduce payload size
- **Selective loading** — only load relations you need

```ts
// ✅ Good: selective loading
const users = await userModel
  .findMany()
  .with({ posts: true })
  .select({ id: true, name: true });

// ⚠️ Careful: deep nesting + all columns
const users = await userModel
  .findMany()
  .with({
    posts: {
      comments: {
        author: true
      }
    }
  });
// This works, but generates a large query with many JOINs
```

### Query optimization tips

- Use `.select()` to fetch only needed columns
- Use `.count()` instead of `.findMany()` when you only need the count
- Add indexes on columns used in `.where()` conditions
- Use `.raw()` to skip formatting when performance is critical

---

## Limitations

Current limitations you should be aware of:

- **Requires Drizzle ORM relations v2** — v1 relations are not supported
- **Explicit `esc()` required** — plain values in `.where()` are not allowed (by design for type safety)
- **No lazy loading** — relations must be loaded eagerly with `.with()`
- **No middleware system** — use `format()` for transformations
- **No query caching** — implement caching at application level if needed
- **No automatic soft deletes** — implement via default `where` conditions
- **No polymorphic relations** — standard Drizzle relation limitations apply

---

## Full API reference

### Intent Stage

Declare what you want to do:

- `where(value)` — filter conditions
- `insert(value)` — insert new rows
- `update(value)` — update existing rows
- `delete()` — delete rows
- `upsert(value)` — insert or update

### Execution Stage

Choose how to execute:

**Queries:**
- `findMany()` — fetch multiple rows
- `findFirst()` — fetch first matching row
- `count()` — count matching rows

**Mutations:**
- `.return()` — return all affected rows
- `.returnFirst()` — return first affected row
- (no return chain) — execute without returning rows

### Refinement Stage

Shape the SQL query:

- `.with(relations)` — load related entities via JOINs
- `.select(fields)` — SQL SELECT whitelist
- `.exclude(fields)` — SQL SELECT blacklist

### Programmatic Stage

Post-process the result:

- `.omit(fields)` — remove fields from result after query
- `.raw()` — skip format function
- `.safe()` — wrap in `{ data, error }`
- `.debug()` — inspect query state

### Model-level utilities

- `include(value)` — specify nested relations for model instances in `.with()`
- `extend(options)` — create extended model with additional methods
- `db(dbInstance)` — bind model to different db/transaction instance

---

## Compatibility

| Drizzle Version | Supported | Notes |
|------------------|-----------|-------|
| v1 beta (≥ 1.0.0-beta.2) | ✅ Yes | Requires relations v2 |
| v0.x stable | ❌ No | Relations v1 not supported |

**Supported dialects:**
- PostgreSQL
- MySQL
- SQLite

**Node.js version:**
- Node.js 18+ recommended
- Bun 1.0+ supported

---

## Dialect notes

- Dialects with native `.returning()` use it for mutation return pipelines.
- Dialects with ID-only return paths may use dialect-specific fallback behavior.
- Upsert uses `onConflictDoUpdate` when supported.

---

## Type safety notes

### Using `esc()` for explicit where expressions

The `esc()` function provides three ways to specify comparison operators:

**1. Implicit equality (simplest):**
```ts
where({ name: esc("Alex") })
```

**2. Explicit operator (Drizzle-style):**
```ts
import { gte } from "drizzle-orm";
where({ age: esc(gte, 18) })
```

**3. Chainable methods (recommended):**
```ts
where({ name: esc.like("%Alex%") })
where({ age: esc.gte(18) })
where({ status: esc.in(["active", "pending"]) })
where({ price: esc.between(10, 100) })
```

**Available chainable methods:**
- `esc.eq(value)` — equality
- `esc.not(value)` — inequality
- `esc.gt(value)` — greater than
- `esc.gte(value)` — greater than or equal
- `esc.lt(value)` — less than
- `esc.lte(value)` — less than or equal
- `esc.like(pattern)` — SQL LIKE pattern matching
- `esc.ilike(pattern)` — case-insensitive LIKE
- `esc.in(values)` — value in array
- `esc.nin(values)` — value not in array
- `esc.between(min, max)` — value between range
- `esc.notBetween(min, max)` — value not between range

### Other type safety features

- `.select()` and `.exclude()` control SQL SELECT columns and refine result types.
- `.omit()` removes fields from the result programmatically after the query.
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
- `relations.test.ts`

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
