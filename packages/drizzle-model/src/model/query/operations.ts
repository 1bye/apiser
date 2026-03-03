import type { Column, SQL } from "drizzle-orm";

export type DrizzleColumnDataType<TColumn extends Column> =
	TColumn["_"]["data"];

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

export interface ColumnOpsBase<T> {
	eq?: OpValue<T>;
	equal?: OpValue<T>;
	in?: OpValue<T>[];
	isNull?: boolean;
	nin?: OpValue<T>[];
	not?: OpValue<T>;
}

export interface NumberOps {
	between?: [OpValue<number>, OpValue<number>];
	gt?: OpValue<number>;
	gte?: OpValue<number>;
	lt?: OpValue<number>;
	lte?: OpValue<number>;
	notBetween?: [OpValue<number>, OpValue<number>];
}

export interface StringOps {
	contains?: OpValue<string>;
	endsWith?: OpValue<string>;
	ilike?: OpValue<string>;
	length?: NumberOps;
	like?: OpValue<string>;
	notRegex?: OpValue<string>;
	regex?: OpValue<string>;
	startsWith?: OpValue<string>;
}

export interface BoolOps {
	isFalse?: boolean;
	isTrue?: boolean;
}

export interface DateOps {
	after?: OpValue<Date | string>;
	before?: OpValue<Date | string>;
	between?: [OpValue<Date | string>, OpValue<Date | string>];
	notOn?: OpValue<Date | string>;
	on?: OpValue<Date | string>;
}

export interface JsonOps<T> {
	has?: T;
	hasAll?: T[];
	hasAny?: T[];
	len?: NumberOps;
}

export interface LogicalOps<TColumn extends Column> {
	and?: ColumnValue<TColumn>[];
	or?: ColumnValue<TColumn>[];
}

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
 * There are three supported forms:
 *
 * 1) Implicit equality (default behavior):
 * ```ts
 * where({ name: esc("Alex") })
 * ```
 *
 * 2) Explicit operator (Drizzle-style):
 * ```ts
 * where({ age: esc(gte, 18) })
 * ```
 *
 * 3) Chainable operator methods (recommended):
 * ```ts
 * where({ name: esc.like("%Alex%") })
 * where({ age: esc.gte(18) })
 * where({ status: esc.in(["active", "pending"]) })
 * where({ price: esc.between(10, 100) })
 * ```
 *
 * Available chainable methods:
 * - `esc.eq(value)` — equality
 * - `esc.not(value)` — inequality
 * - `esc.gt(value)` — greater than
 * - `esc.gte(value)` — greater than or equal
 * - `esc.lt(value)` — less than
 * - `esc.lte(value)` — less than or equal
 * - `esc.like(pattern)` — SQL LIKE pattern matching
 * - `esc.ilike(pattern)` — case-insensitive LIKE
 * - `esc.in(values)` — value in array
 * - `esc.nin(values)` — value not in array
 * - `esc.between(min, max)` — value between range
 * - `esc.notBetween(min, max)` — value not between range
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
		if (arg2 === undefined) {
			return undefined;
		}

		return {
			__kind: "esc-op",
			op: arg1 as (column: any, value: T) => any,
			value: arg2 as T,
		};
	}

	if (arg1 === undefined) {
		return undefined;
	}

	return {
		equal: arg1,
	};
}

// Chainable operator methods - return DSL objects
esc.eq = <T>(value: T) => ({ eq: value });

esc.not = <T>(value: T) => ({ not: value });

esc.gt = <T>(value: T) => ({ gt: value });

esc.gte = <T>(value: T) => ({ gte: value });

esc.lt = <T>(value: T) => ({ lt: value });

esc.lte = <T>(value: T) => ({ lte: value });

esc.like = (pattern: string) => ({ like: pattern });

esc.ilike = (pattern: string) => ({ ilike: pattern });

esc.in = <T>(values: T[]) => ({ in: values });

esc.nin = <T>(values: T[]) => ({ nin: values });

esc.between = <T>(min: T, max: T) => ({ between: [min, max] as [T, T] });

esc.notBetween = <T>(min: T, max: T) => ({
	notBetween: [min, max] as [T, T],
});
