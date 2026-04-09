import { asc, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql";

/** Generic record type used throughout. */
type AnyRecord = Record<string, unknown>;

/**
 * Supported order directions.
 */
export type OrderDirection = "asc" | "desc";

/**
 * Object-based order syntax: { column: 'asc' | 'desc' }
 */
export type OrderByObject = Record<string, OrderDirection>;

/**
 * Order value can be:
 * - Object syntax: { age: 'desc', name: 'asc' }
 * - Drizzle SQL: asc(column), desc(column)
 * - Array of Drizzle SQL: [desc(age), asc(name)]
 */
export type OrderByValue = OrderByObject | SQL | SQL[];

/**
 * Compiles order-by clauses into Drizzle SQL order expressions.
 */
export class OrderByCompiler {
	/**
	 * Compiles an order value into an array of Drizzle order SQL expressions.
	 *
	 * Supports three syntaxes:
	 * 1. Object: `{ age: 'desc', name: 'asc' }` → `[desc(table.age), asc(table.name)]`
	 * 2. Single Drizzle: `asc(table.age)` → `[asc(table.age)]`
	 * 3. Array Drizzle: `[desc(table.age), asc(table.name)]` → unchanged
	 *
	 * @param table - The Drizzle table object with column references
	 * @param value - The order value to compile
	 * @returns Array of Drizzle SQL order expressions, or undefined if value is empty
	 */
	compile(
		table: AnyRecord,
		value: OrderByValue | undefined
	): SQL[] | undefined {
		if (!value) {
			return undefined;
		}

		// Handle array of Drizzle SQL expressions
		if (Array.isArray(value)) {
			return value.length > 0 ? value : undefined;
		}

		// Handle single Drizzle SQL expression (asc() or desc() call)
		if (this.isDrizzleOrder(value)) {
			return [value as SQL];
		}

		// Handle object syntax: { column: 'asc' | 'desc' }
		if (typeof value === "object" && value !== null) {
			const result: SQL[] = [];
			for (const [columnName, direction] of Object.entries(value)) {
				const column = table[columnName];
				if (column) {
					if (direction === "desc") {
						result.push(desc(column as any));
					} else {
						result.push(asc(column as any));
					}
				}
			}
			return result.length > 0 ? result : undefined;
		}

		return undefined;
	}

	/**
	 * Checks if a value is a Drizzle order expression (asc() or desc() result).
	 */
	private isDrizzleOrder(value: unknown): boolean {
		if (!value || typeof value !== "object") {
			return false;
		}
		// Drizzle SQL expressions have specific internal markers
		const record = value as AnyRecord;
		// Check for column types
		if (
			record.constructor?.name === "SQLiteColumn" ||
			record.constructor?.name === "PgColumn" ||
			record.constructor?.name === "MySqlColumn"
		) {
			return true;
		}
		// Check for SQL wrapper objects
		if (typeof record.getSQL === "function") {
			return true;
		}
		// Check for order type marker
		if (
			record._ &&
			typeof record._ === "object" &&
			(record._ as AnyRecord).type === "order"
		) {
			return true;
		}
		return false;
	}
}
