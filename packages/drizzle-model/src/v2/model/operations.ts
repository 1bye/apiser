import type { DrizzleColumnDataType } from "@/types";
import type { Column, SQL } from "drizzle-orm";

export type ColumnOpsBase<T> = {
  eq?: T | SQL;
  equal?: T | SQL;
  not?: T | SQL;
  in?: (T | SQL)[];
  nin?: (T | SQL)[];
  isNull?: boolean;
};

export type NumberOps = {
  gt?: number | SQL;
  gte?: number | SQL;
  lt?: number | SQL;
  lte?: number | SQL;
  between?: [number | SQL, number | SQL];
  notBetween?: [number | SQL, number | SQL];
};

export type StringOps = {
  like?: string | SQL;
  ilike?: string | SQL;
  startsWith?: string | SQL;
  endsWith?: string | SQL;
  contains?: string | SQL;
  regex?: string | SQL;
  notRegex?: string | SQL;
  length?: NumberOps;
};

export type BoolOps = {
  isTrue?: boolean;
  isFalse?: boolean;
};

export type DateOps = {
  before?: Date | string | SQL;
  after?: Date | string | SQL;
  on?: Date | string | SQL;
  notOn?: Date | string | SQL;
  between?: [Date | string | SQL, Date | string | SQL];
};

export type JsonOps<T> = {
  has?: T;
  hasAny?: T[];
  hasAll?: T[];
  len?: NumberOps;
};

export type LogicalOps<TColumn extends Column> = {
  or?: ColumnValue<TColumn>[];
  and?: ColumnValue<TColumn>[];
};

export type TypeOps<T> = T extends number
  ? NumberOps
  : T extends string
  ? StringOps
  : T extends boolean
  ? BoolOps
  : T extends Date
  ? DateOps
  : T extends any[]
  ? JsonOps<T[number]>
  : {};

export type ColumnOps<
  TColumn extends Column,
  TDataType extends DrizzleColumnDataType<TColumn>,
> = ColumnOpsBase<TDataType> & TypeOps<TDataType> & LogicalOps<TColumn>;

export type ColumnValue<
  TColumn extends Column,
  TDataType extends
  DrizzleColumnDataType<TColumn> = DrizzleColumnDataType<TColumn>,
> = ColumnOps<TColumn, TDataType> | EscapedValue<TDataType>;

export type EscapedValue<T> =
  | {
    equal: T;
  }
  | {
    __kind: "esc-op";
    op: (column: any, value: T) => any;
    value: T;
  };

/**
 * Escapes a value from the query DSL and forces it to be compiled using
 * a specific comparison operator.
 *
 * This function exists as an explicit escape hatch for cases where:
 * - the default DSL operators are insufficient
 * - Drizzle ORM operators should be used directly
 * - complex types (e.g. Date, objects, custom classes) need safe handling
 *
 * There are two supported forms:
 *
 * 1) Implicit equality (default behavior):
 * ```ts
 * where({ name: esc("Alex") })
 * ```
 * Compiles to:
 * ```ts
 * {
 *  eq: "Alex"
 * }
 * // In drizzle: eq(column, "Alex")
 * ```
 *
 * 2) Explicit operator (Drizzle-style):
 * ```ts
 * where({ age: esc(gte, 18) })
 * ```
 * Compiles to:
 * ```ts
 * gte(column, 18)
 * ```
 *
 * The column is injected later during query compilation.
 * `esc` does NOT execute the operator immediately.
 *
 * @typeParam T - The value type being compared against the column
 *
 * @param value - Value to compare using implicit equality
 *
 * @returns An internal escaped descriptor consumed by the query compiler
 */
export function esc<T>(value: T): EscapedValue<T>;

/**
 * Escapes a value from the query DSL and forces it to be compiled using
 * the provided binary operator.
 *
 * This overload allows reuse of Drizzle ORM operators that normally
 * require the column as the first argument.
 *
 * @typeParam T - The value type expected by the operator
 *
 * @param op - A binary comparison operator (e.g. eq, gte, ilike)
 * @param value - Value to pass as the operator's right-hand side
 *
 * @returns An internal escaped descriptor consumed by the query compiler
 */
export function esc<T>(
  op: (column: any, value: T) => any,
  value: T
): EscapedValue<T>;

export function esc<T>(
  arg1: T | ((column: any, value: T) => any),
  arg2?: T
): EscapedValue<T> {
  if (typeof arg1 === "function") {
    return {
      __kind: "esc-op",
      op: arg1,
      value: arg2 as T,
    };
  }

  return {
    equal: arg1,
  };
}
