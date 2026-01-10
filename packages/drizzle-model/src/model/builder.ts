import {
  and,
  between,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  like,
  lt,
  lte,
  ne,
  notBetween,
  notInArray,
  or,
} from "drizzle-orm";
import type { AnyRelations, EmptyRelations, SQL } from "drizzle-orm";
import type { Model } from "./model.ts";
import type { ModelDialect } from "./dialect.ts";
import type { ModelOptions } from "./options.ts";
import type { ModelConfig } from "./config.ts";
import type { MethodWhereValue } from "./methods/query/where.ts";
import type { EscapedValue } from "./query/operations.ts";
import type { MethodWithValue } from "./methods/with.ts";
import type { MethodSelectValue } from "./methods/select.ts";
import type { MethodExcludeValue } from "./methods/exclude.ts";
import type { MethodUpsertValue } from "./methods/upsert.ts";

type AnyObj = Record<string, any>;

type QueryKind = "findMany" | "findFirst";
type MutateKind = "insert" | "update" | "delete" | "upsert";

type QueryState = {
  where?: unknown;
  with?: unknown;
  raw?: boolean;
  select?: AnyObj;
  exclude?: AnyObj;
};

type MutateState = {
  kind: MutateKind;
  where?: unknown;
  value?: unknown;
  returnSelect?: AnyObj;
};

function isPromiseLike(value: any): value is PromiseLike<any> {
  return value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}

function isEscapedValue(value: any): value is EscapedValue<any> {
  return value && typeof value === "object" && ("equal" in value || value.__kind === "esc-op");
}

function unwrapEscapedValue(column: any, value: any): { sql?: SQL; value?: any } {
  if (!isEscapedValue(value)) return { value };

  if ((value as any).__kind === "esc-op") {
    return {
      sql: (value as any).op(column, (value as any).value),
    };
  }

  return {
    value: (value as any).equal,
  };
}

function compileColumnValue(column: any, value: any): SQL | undefined {
  if (isEscapedValue(value)) {
    if ((value as any).__kind === "esc-op") {
      return (value as any).op(column, (value as any).value);
    }
    return eq(column, (value as any).equal);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const parts: SQL[] = [];

    const pushIf = (sql: SQL | undefined) => {
      if (sql) parts.push(sql);
    };

    const v: AnyObj = value;
    if ("eq" in v) {
      const u = unwrapEscapedValue(column, v.eq);
      pushIf(u.sql ?? eq(column, u.value));
    }
    if ("equal" in v) {
      const u = unwrapEscapedValue(column, v.equal);
      pushIf(u.sql ?? eq(column, u.value));
    }
    if ("not" in v) {
      const u = unwrapEscapedValue(column, v.not);
      pushIf(u.sql ?? ne(column, u.value));
    }
    if ("in" in v) {
      const arr = (v.in ?? []).map((item: any) => unwrapEscapedValue(column, item));
      const sqls = arr.map((x: { sql?: SQL; value?: any }) => x.sql).filter(Boolean) as SQL[];
      const values = arr.map((x: { sql?: SQL; value?: any }) => x.value).filter((x: any) => x !== undefined);
      if (sqls.length) pushIf(or(...sqls));
      if (values.length) pushIf(inArray(column, values));
    }
    if ("nin" in v) {
      const arr = (v.nin ?? []).map((item: any) => unwrapEscapedValue(column, item));
      const sqls = arr.map((x: { sql?: SQL; value?: any }) => x.sql).filter(Boolean) as SQL[];
      const values = arr.map((x: { sql?: SQL; value?: any }) => x.value).filter((x: any) => x !== undefined);
      if (sqls.length) pushIf(or(...sqls));
      if (values.length) pushIf(notInArray(column, values));
    }
    if ("isNull" in v) pushIf(v.isNull ? isNull(column) : undefined);

    if ("gt" in v) {
      const u = unwrapEscapedValue(column, v.gt);
      pushIf(u.sql ?? gt(column, u.value));
    }
    if ("gte" in v) {
      const u = unwrapEscapedValue(column, v.gte);
      pushIf(u.sql ?? gte(column, u.value));
    }
    if ("lt" in v) {
      const u = unwrapEscapedValue(column, v.lt);
      pushIf(u.sql ?? lt(column, u.value));
    }
    if ("lte" in v) {
      const u = unwrapEscapedValue(column, v.lte);
      pushIf(u.sql ?? lte(column, u.value));
    }
    if ("between" in v) {
      const a = unwrapEscapedValue(column, v.between?.[0]);
      const b = unwrapEscapedValue(column, v.between?.[1]);
      if (a.sql) pushIf(a.sql);
      if (b.sql) pushIf(b.sql);
      pushIf(between(column, a.value, b.value));
    }
    if ("notBetween" in v) {
      const a = unwrapEscapedValue(column, v.notBetween?.[0]);
      const b = unwrapEscapedValue(column, v.notBetween?.[1]);
      if (a.sql) pushIf(a.sql);
      if (b.sql) pushIf(b.sql);
      pushIf(notBetween(column, a.value, b.value));
    }

    if ("like" in v) {
      const u = unwrapEscapedValue(column, v.like);
      pushIf(u.sql ?? like(column, u.value));
    }
    if ("ilike" in v) {
      const u = unwrapEscapedValue(column, v.ilike);
      pushIf(u.sql ?? ilike(column, u.value));
    }

    if (Array.isArray(v.or)) {
      const sub = v.or
        .map((item: any) => compileColumnValue(column, item))
        .filter(Boolean) as SQL[];
      if (sub.length) pushIf(or(...sub));
    }

    if (Array.isArray(v.and)) {
      const sub = v.and
        .map((item: any) => compileColumnValue(column, item))
        .filter(Boolean) as SQL[];
      if (sub.length) pushIf(and(...sub));
    }

    if (!parts.length) return undefined;
    return parts.length === 1 ? parts[0] : and(...parts);
  }

  return eq(column, value);
}

function compileWhereObject(fields: AnyObj, where: AnyObj): SQL | undefined {
  const parts: SQL[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;

    const col = (fields as any)[key];
    if (col) {
      const sql = compileColumnValue(col, value);
      if (sql) parts.push(sql);
      continue;
    }

    if (value && typeof value === "object") {
      throw new Error(`Relation where is not implemented yet for key '${key}'.`);
    }
  }

  if (!parts.length) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
}

function compileWhere(fields: AnyObj, where: unknown): SQL | undefined {
  if (!where) return undefined;

  if (typeof where === "object" && where && !isPromiseLike(where)) {
    if ((where as any).$model === "model") {
      throw new Error("Model-as-where is not implemented yet.");
    }
    if ((where as any).getSQL) return where as any;
    return compileWhereObject(fields, where as AnyObj);
  }

  return where as any;
}

function applySelect(value: any, select: AnyObj): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => applySelect(v, select));
  if (typeof value !== "object") return value;

  const out: AnyObj = {};
  for (const [key, sel] of Object.entries(select)) {
    if (sel === true) {
      out[key] = (value as any)[key];
      continue;
    }
    if (sel && typeof sel === "object") {
      out[key] = applySelect((value as any)[key], sel as AnyObj);
    }
  }
  return out;
}

function applyExclude(value: any, exclude: AnyObj): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => applyExclude(v, exclude));
  if (typeof value !== "object") return value;

  const out: AnyObj = { ...(value as AnyObj) };
  for (const [key, ex] of Object.entries(exclude)) {
    if (ex === true) {
      delete out[key];
      continue;
    }
    if (ex && typeof ex === "object" && key in out) {
      out[key] = applyExclude(out[key], ex as AnyObj);
    }
  }
  return out;
}

function applyFormat(value: any, format: any): any {
  if (!format) return value;
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => applyFormat(v, format));
  if (typeof value !== "object") return value;
  return format(value);
}

class ThenableResult<T> implements PromiseLike<T> {
  protected _execute: () => Promise<T>;

  constructor(execute: () => Promise<T>) {
    this._execute = execute;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled as any, onrejected as any);
  }
}

class QueryResult<T> extends ThenableResult<T> {
  private state: QueryState;
  private runner: (state: QueryState) => Promise<T>;

  constructor(state: QueryState, runner: (state: QueryState) => Promise<T>) {
    super(() => runner(state));
    this.state = state;
    this.runner = runner;
  }

  with(value: MethodWithValue<any, any>): any {
    return new QueryResult({ ...this.state, with: value }, this.runner) as any;
  }

  select(value: MethodSelectValue<any>): any {
    return new QueryResult({ ...this.state, select: value as any }, this.runner) as any;
  }

  exclude(value: MethodExcludeValue<any>): any {
    return new QueryResult({ ...this.state, exclude: value as any }, this.runner) as any;
  }

  raw(): any {
    return new QueryResult({ ...this.state, raw: true }, this.runner) as any;
  }

  debug(): any {
    return this.state;
  }
}

class MutateResult<T> extends ThenableResult<T> {
  private state: MutateState;
  private runner: (state: MutateState) => Promise<T>;

  constructor(state: MutateState, runner: (state: MutateState) => Promise<T>) {
    super(() => runner(state));
    this.state = state;
    this.runner = runner;
  }

  return(value?: AnyObj): any {
    return new MutateResult({ ...this.state, returnSelect: value }, this.runner) as any;
  }
}

function makeModelRuntime(config: {
  db: any;
  schema: Record<string, any>;
  relations: Record<string, any>;
  tableName: string;
  dialect: ModelDialect;
  options: ModelOptions<any, any, any, any>;
}): any {
  const baseState = {
    db: config.db,
    where: undefined as unknown,
  };

  const build = (state: typeof baseState): any => {
    const modelObj: AnyObj = {
      $model: "model",
      $modelName: config.tableName,
      $format: config.options.format,
      $formatValue: undefined,
      where(value: MethodWhereValue<any, any>) {
        return build({ ...state, where: value });
      },
      include(value: MethodWithValue<any, any>) {
        return value;
      },
      extend(nextOptions: any) {
        return makeModelRuntime({
          ...config,
          options: {
            ...config.options,
            ...nextOptions,
            methods: {
              ...(nextOptions?.methods ?? {}),
              ...(config.options?.methods ?? {}),
            },
            format: nextOptions?.format ?? config.options?.format,
          },
        });
      },
      db(db: any) {
        return makeModelRuntime({ ...config, db });
      },
    };

    const attachMethods = (methods: AnyObj | undefined) => {
      if (!methods) return;
      for (const [key, fn] of Object.entries(methods)) {
        if (typeof fn === "function") {
          (modelObj as any)[key] = fn.bind(modelObj);
        }
      }
    };

    attachMethods(config.options.methods);

    modelObj.findMany = () => {
      const runner = async (qState: QueryState) => {
        const table = (config.schema as any)[config.tableName];
        const whereSql = compileWhere(table as AnyObj, state.where);

        let result: any;
        if (qState.with) {
          const query = (config.db as any).query?.[config.tableName];
          if (!query?.findMany) {
            throw new Error(`db.query['${config.tableName}'].findMany is not available.`);
          }

          result = await query.findMany({
            where: whereSql,
            with: qState.with,
          });
        } else {
          let q = (config.db as any).select().from(table);
          if (whereSql) q = q.where(whereSql);
          result = await q;
        }

        let out: any = result;
        if (qState.select) out = applySelect(out, qState.select);
        if (qState.exclude) out = applyExclude(out, qState.exclude);
        if (!qState.raw) out = applyFormat(out, config.options.format);
        return out;
      };

      return new QueryResult({} as QueryState, runner) as any;
    };

    modelObj.findFirst = () => {
      const runner = async (qState: QueryState) => {
        const table = (config.schema as any)[config.tableName];
        const whereSql = compileWhere(table as AnyObj, state.where);

        let result: any;
        if (qState.with) {
          const query = (config.db as any).query?.[config.tableName];
          if (!query?.findFirst) {
            throw new Error(`db.query['${config.tableName}'].findFirst is not available.`);
          }

          result = await query.findFirst({
            where: whereSql,
            with: qState.with,
          });
        } else {
          let q = (config.db as any).select().from(table);
          if (whereSql) q = q.where(whereSql);
          q = q.limit(1);
          const rows = await q;
          result = rows[0];
        }

        let out: any = result;
        if (qState.select) out = applySelect(out, qState.select);
        if (qState.exclude) out = applyExclude(out, qState.exclude);
        if (!qState.raw) out = applyFormat(out, config.options.format);
        return out;
      };

      return new QueryResult({} as QueryState, runner) as any;
    };

    modelObj.insert = (value: any) => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        const q = (config.db as any).insert(table).values(mState.value);
        const returned = (q as any).returning ? await (mState.returnSelect ? q.returning(mState.returnSelect) : q.returning()) : await q;
        return returned as any;
      };

      return new MutateResult({ kind: "insert", value } as MutateState, runner) as any;
    };

    modelObj.update = (value: any) => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        let q = (config.db as any).update(table).set(mState.value);
        if (state.where && (state.where as any).getSQL) {
          q = q.where(state.where as any);
        } else if (state.where && typeof state.where === "object") {
          q = q.where((fields: AnyObj) => compileWhereObject(fields, state.where as AnyObj));
        }
        const returned = (q as any).returning ? await (mState.returnSelect ? q.returning(mState.returnSelect) : q.returning()) : await q;
        return returned as any;
      };

      return new MutateResult({ kind: "update", value } as MutateState, runner) as any;
    };

    modelObj.delete = () => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        let q = (config.db as any).delete(table);
        if (state.where && (state.where as any).getSQL) {
          q = q.where(state.where as any);
        } else if (state.where && typeof state.where === "object") {
          q = q.where((fields: AnyObj) => compileWhereObject(fields, state.where as AnyObj));
        }
        const returned = (q as any).returning ? await (mState.returnSelect ? q.returning(mState.returnSelect) : q.returning()) : await q;
        return returned as any;
      };

      return new MutateResult({ kind: "delete" } as MutateState, runner) as any;
    };

    modelObj.upsert = (value: MethodUpsertValue<any>) => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        const insertValues = (mState.value as any).insert;
        const updateCfg = (mState.value as any).update;
        const target = (mState.value as any).target;
        let updateSet = updateCfg;
        if (typeof updateCfg === "function") {
          updateSet = updateCfg({
            excluded: (field: string) => (table as any)[field],
            inserted: (field: string) => (table as any)[field],
          });
        }

        let q = (config.db as any).insert(table).values(insertValues);
        if (q.onConflictDoUpdate) {
          q = q.onConflictDoUpdate({
            target,
            set: updateSet,
          });
        }

        const returned = (q as any).returning ? await (mState.returnSelect ? q.returning(mState.returnSelect) : q.returning()) : await q;
        return returned as any;
      };

      return new MutateResult({ kind: "upsert", value } as MutateState, runner) as any;
    };

    return modelObj;
  };

  return build(baseState);
}

export function modelBuilder<
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations,
  TDialect extends ModelDialect = ModelDialect,
>({
  db,
  relations,
  schema,
  dialect,
}: {
  relations: TRelations;
  db: any;
  schema: TFullSchema;
  dialect: TDialect;
}) {
  return <
    TTableName extends keyof TRelations,
    TOptions extends ModelOptions<
      TRelations,
      TRelations[TTableName],
      TDialect,
      TOptions
    >,
  >(
    table: TTableName,
    options: TOptions,
  ) => {
    return makeModelRuntime({
      db,
      relations: relations as any,
      schema: schema as any,
      tableName: table as any,
      dialect,
      options: (options ?? {}) as any,
    }) as Model<
      ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
    >;
  };
}
