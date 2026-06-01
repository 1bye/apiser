# drizzle-model Improvement Plan

## Phase 1 — Correctness (bugs & lies)

1. **`where()` with relation key throws at runtime**
   - File: `core/query/where.ts:122-127`
   - `MethodWhereValue` accepts `MethodWhereRelations`, but `compileObject` skips unknown keys and the fallback throws `"Relation where is not implemented yet"`
   - Fix: implement relation-where compilation (match column on nested table), or strip `MethodWhereRelations` from `MethodWhereValue` if intentionally deferred.

2. **`.with()` drops `orderBy`/`limit` from related models**
   - File: `core/query/joins.ts` — `extractRelationDescriptor` (line 559) only reads `whereValue` + `with`
   - `ModelRuntime` exposes `.$orderBy` and `.$limit` getters; `JoinExecutor` ignores them
   - `tests/snippets/x-3.ts` shows `postModel.where({...}).limit(1)` inside `.with()` — silently no-ops
   - Fix: add `orderBy`/`limit` fields to `JoinNode`, read from model descriptor in `extractRelationDescriptor`, pass through to `executeQuery`

3. **`ModelQueryResult.debug()` typed as `any`** (`model/result.ts:60`)
   - Fix: type as `QueryState` (export from `core/result.ts` if not already public)

4. **`QueryResult.select()`/`.exclude()` reject array syntax**
   - Runtime accepts `string[]` but `QueryResult` types only take `AnyRecord`
   - Fix: union the type to `AnyRecord | string[]`

---

## Phase 2 — Missing operators (low-risk, high-value)

5. **`esc.isNotNull()` chainable**
   - File: `model/query/operations.ts`
   - DSL type in `ColumnOpsBase` has `isNull?: boolean` but no `isNotNull`
   - Add `esc.isNotNull = () => ({ isNull: false })`; update `WhereCompiler.compileNull` to handle `isNull === false`

6. **`esc.and(...)` and `esc.or(...)` logical combinators**
   - Add `esc.and = <T>(...values) => ({ and: values })` and `esc.or = <T>(...values) => ({ or: values })`
   - Already compiled by `compileLogical` in where compiler — just need the chainable entry point

7. **`esc.sql(raw)` for raw SQL fragments**
   - Add `esc.sql = (sql: SQL) => sql` passthrough — where compiler already sees raw SQL and passes it through

---

## Phase 3 — Common query helpers

8. **`.offset(n)` / `.skip(n)` — pagination**
   - New files: none, spread across `ModelRuntime` (+ `currentOffset` field), `QueryState` (+ `offset`), `QueryResult.offset()`, `JoinExecutorConfig` (+ `offset`)
   - `ModelQueryMethods` type: `offset(n: number): Model<TConfig>`
   - Runtime: `query.offset(n)` after `where`/`orderBy`/`limit`

9. **`.groupBy(cols)` / `.having(where)`**
   - `ModelRuntime.groupBy(value)` / `QueryState` / `JoinExecutorConfig`
   - Type-level only for now; runtime compiles via `query.groupBy(...)` / `query.having(...)`

10. **`.distinct()` / `.distinctOn(cols)`**
    - `ModelRuntime.distinct()` / `QueryState` / `JoinExecutorConfig`

11. **`.findFirstOrThrow()` — throws if no row found**
    - `ModelRuntime.findFirstOrThrow()` wraps `findFirst()` with a throw on undefined
    - Type: `ModelQueryResult<NonNullable<tableOutput>, TConfig>` — non-nullable

12. **`.onConflictDoNothing()` on upsert**
    - `ModelRuntime.upsert` already calls `onConflictDoUpdate`; add a branch when `update` is explicitly `undefined`/`null` → call `onConflictDoNothing()` on the query

---

## Phase 4 — Dead code removal & metadata

13. **Delete dead files/types**
    - `src/model/foreigns.ts` — fully stubbed, commented-out; just delete it
    - `src/model/methods/levels.ts:1-9` — `ModelLevelMethods`, `ModelFirstLevelMethods` unused anywhere
    - `src/model/result.ts:138-154` — commented-out nested insert `with()` — remove or document
    - `tests/snippets/x-1.ts`, `x-2.ts`, `x-3.ts` — unimported, duplicate docs (snippets already in README); delete
    - `tests/db.ts:3-8` — commented MySQL; delete
    - `tests/base.ts:15-21` — unused `logger` export; delete

14. **`package.json` metadata**
    - Add `description`, `keywords`, `repository`, `bugs`, `homepage`, `engines`
    - Add scripts: `"test": "bun test"`, `"build": "tsdown"`, `"prepare": "bun run build"`
    - Remove `drizzle-kit` from devDeps (or keep but remove `drizzle.config.ts` if no migrations)

15. **`drizzle.config.ts`**
    - Remove if no `drizzle/` migrations are committed; the schema is test-only

---

## Phase 5 — Cleanup & hardening

16. **`.env` removal**
    - Replace real credentials in `tests/db.ts` with env-var guard: exit if `DATABASE_URL` unset
    - Keep `.env` in `.gitignore` (already there)

17. **Normalize import style**
    - Pick one: `@/...` alias or relative `.ts` extensions. Move all imports to one convention.

18. **`debug()` return type** already covered in Phase 1

19. **Nested relation `where` compilation** — if deferred, document the gap in README Limitations

---

## Phase 6 — Architecture (future, not started)

- Split `core/runtime.ts` into per-operation files
- Add unit tests for `WhereCompiler`, `OrderByCompiler`, `JoinExecutor`, `ResultTransformer`
- Plumb `orderBy`/`limit` per-relation in `JoinExecutorConfig`
- Views support (ROADMAP)
- Streaming / cursor iteration
- `insert` with nested create (relations)
- Per-operation `logger` hook
- `beforeInsert`/`beforeUpdate`/`beforeDelete` middleware

---

## Execution order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

Phase 1 fixes bugs users hit today. Phase 2 adds the most-requested missing operators. Phase 3 adds the common query helpers every ORM wrapper needs. Phase 4 clears cruft and polishes metadata. Phase 5 seals the surface area. Phase 6 is a larger refactor.
