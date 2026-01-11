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
import type { SQL } from "drizzle-orm";
import type { EscapedValue } from "../query/operations.ts";

type AnyObj = Record<string, any>;

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

export function compileWhereObject(fields: AnyObj, where: AnyObj): SQL | undefined {
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

export function compileWhere(fields: AnyObj, where: unknown): SQL | undefined {
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
