import type { Column, SQL } from "drizzle-orm";

export type DrizzleColumnDataType<TColumn extends Column> = TColumn["_"]["data"];

export type EscapedValue<T> =
  | {
    equal: T;
  }
  | {
    __kind: "esc-op";
    op: {
      bivarianceHack(column: any, value: T): any;
    }["bivarianceHack"];
    value: T;
  };

type OpValue<T> = T | SQL | EscapedValue<T>;

export type ColumnOpsBase<T> = {
  eq?: OpValue<T>;
  equal?: OpValue<T>;
  not?: OpValue<T>;
  in?: OpValue<T>[];
  nin?: OpValue<T>[];
  isNull?: boolean;
};

export type NumberOps = {
  gt?: OpValue<number>;
  gte?: OpValue<number>;
  lt?: OpValue<number>;
  lte?: OpValue<number>;
  between?: [OpValue<number>, OpValue<number>];
  notBetween?: [OpValue<number>, OpValue<number>];
};

export type StringOps = {
  like?: OpValue<string>;
  ilike?: OpValue<string>;
  startsWith?: OpValue<string>;
  endsWith?: OpValue<string>;
  contains?: OpValue<string>;
  regex?: OpValue<string>;
  notRegex?: OpValue<string>;
  length?: NumberOps;
};

export type BoolOps = {
  isTrue?: boolean;
  isFalse?: boolean;
};

export type DateOps = {
  before?: OpValue<Date | string>;
  after?: OpValue<Date | string>;
  on?: OpValue<Date | string>;
  notOn?: OpValue<Date | string>;
  between?: [OpValue<Date | string>, OpValue<Date | string>];
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

export function esc<T>(arg1: any, arg2?: any): EscapedValue<T> {
  if (typeof arg1 === "function") {
    return {
      __kind: "esc-op",
      op: arg1 as (column: any, value: T) => any,
      value: arg2 as T,
    };
  }

  return {
    equal: arg1,
  };
}
