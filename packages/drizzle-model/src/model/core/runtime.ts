import type { ModelDialect } from "../dialect.ts";
import type { ModelOptions } from "../options.ts";
import type { MethodUpsertValue } from "../methods/upsert.ts";
import type { MethodWhereValue } from "../methods/query/where.ts";
import type { MethodWithValue } from "../methods/with.ts";

import { MutateResult, QueryResult } from "./thenable.ts";
import type { MutateState, QueryState } from "./thenable.ts";
import { applyExclude, applyFormat, applySelect } from "./transform.ts";
import { buildSelectProjection } from "./projection.ts";
import { compileWhere } from "./where.ts";
import { runWithJoins } from "./with.ts";
import type { ReturningIdDialects } from "../dialect.ts";

type AnyObj = Record<string, any>;

type MutateKind = "insert" | "update" | "delete" | "upsert";

type BaseState = {
  db: any;
  where: unknown;
};

function isReturningIdDialect(dialect: string): dialect is ReturningIdDialects {
  return dialect === "MySQL" || dialect === "SingleStore" || dialect === "CockroachDB";
}

async function execReturn(q: any, mState: MutateState, dialect: string): Promise<any> {
  if (typeof q?.returning === "function") {
    return await (mState.returnSelect ? q.returning(mState.returnSelect) : q.returning());
  }
  if (isReturningIdDialect(dialect) && typeof q?.$returningId === "function") {
    return await q.$returningId();
  }
  return await q;
}

function normalizeUpsertTarget(table: AnyObj, target: any): any {
  if (!target) return target;
  if (typeof target === "string") return (table as any)[target] ?? target;
  if (Array.isArray(target)) {
    return target.map((t) => (typeof t === "string" ? ((table as any)[t] ?? t) : t));
  }
  return target;
}

export function makeModelRuntime(config: {
  db: any;
  schema: Record<string, any>;
  relations: Record<string, any>;
  tableName: string;
  dialect: ModelDialect;
  options: ModelOptions<any, any, any, any>;
}): any {
  const baseState: BaseState = {
    db: config.db,
    where: undefined as unknown,
  };

  const build = (state: BaseState): any => {
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
          result = await runWithJoins({
            db: config.db,
            schema: config.schema,
            relations: config.relations,
            tableName: config.tableName,
            table,
            dialect: config.dialect,
            whereSql,
            qState,
            kind: "many",
          });
        } else {
          const { selectMap } = buildSelectProjection(table as AnyObj, qState.select as any, qState.exclude as any);
          let q = (config.db as any).select(selectMap).from(table);
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
          result = await runWithJoins({
            db: config.db,
            schema: config.schema,
            relations: config.relations,
            tableName: config.tableName,
            table,
            dialect: config.dialect,
            whereSql,
            qState,
            kind: "one",
          });
        } else {
          const { selectMap } = buildSelectProjection(table as AnyObj, qState.select as any, qState.exclude as any);
          let q = (config.db as any).select(selectMap).from(table);
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
        return await execReturn(q, mState, config.dialect);
      };

      return new MutateResult({ kind: "insert" as MutateKind, value } as MutateState, runner) as any;
    };

    modelObj.update = (value: any) => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        const whereSql = compileWhere(table as AnyObj, state.where);
        let q = (config.db as any).update(table).set(mState.value);
        if (whereSql) q = q.where(whereSql);
        return await execReturn(q, mState, config.dialect);
      };

      return new MutateResult({ kind: "update" as MutateKind, value } as MutateState, runner) as any;
    };

    modelObj.delete = () => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        const whereSql = compileWhere(table as AnyObj, state.where);
        let q = (config.db as any).delete(table);
        if (whereSql) q = q.where(whereSql);
        return await execReturn(q, mState, config.dialect);
      };

      return new MutateResult({ kind: "delete" as MutateKind } as MutateState, runner) as any;
    };

    modelObj.upsert = (value: MethodUpsertValue<any>) => {
      const runner = async (mState: MutateState) => {
        const table = (config.schema as any)[config.tableName];
        const insertValues = (mState.value as any).insert;
        const updateCfg = (mState.value as any).update;
        const target = normalizeUpsertTarget(table as AnyObj, (mState.value as any).target);
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

        return await execReturn(q, mState, config.dialect);
      };

      return new MutateResult({ kind: "upsert" as MutateKind, value } as MutateState, runner) as any;
    };

    return modelObj;
  };

  return build(baseState);
}
