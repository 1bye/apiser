import type { SQL } from "drizzle-orm";
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
import type { EscapedValue } from "../../model/query/operations.ts";

/** Generic record type used throughout the where compiler. */
type AnyRecord = Record<string, unknown>;

/** The unwrapped result of an escaped value — either raw SQL or a plain value. */
interface UnwrappedValue {
	sql?: SQL;
	value?: unknown;
}

/**
 * Compiles user-facing where objects into Drizzle SQL conditions.
 *
 * Handles plain column equality, operator objects (`eq`, `gt`, `like`, …),
 * logical combinators (`and`, `or`), and the `esc()` escape-hatch values.
 *
 * Designed as a stateless utility — every method receives its inputs
 * explicitly so the class can be instantiated once and reused.
 */
export class WhereCompiler {
	/**
	 * Compiles a where value against a set of table fields into a Drizzle SQL condition.
	 *
	 * Accepts multiple forms:
	 * - A raw Drizzle `SQL` expression (passed through as-is).
	 * - A plain object mapping column names to values or operator descriptors.
	 * - `undefined` / `null` / falsy (returns `undefined`).
	 *
	 * @param fields - The Drizzle column map for the table (e.g. `schema.users`).
	 * @param where  - The user-supplied where clause.
	 * @returns A compiled `SQL` fragment, or `undefined` when no conditions apply.
	 */
	compile(fields: AnyRecord, where: unknown): SQL | undefined {
		if (!where) {
			return undefined;
		}

		if (typeof where !== "object" || this.isPromiseLike(where)) {
			return where as SQL;
		}

		if (this.isDrizzleSql(where)) {
			return where as SQL;
		}

		return this.compileObject(fields, where as AnyRecord);
	}

	/**
	 * Merges two independent where sources (e.g. model-level + call-level)
	 * into a single `AND` condition.
	 *
	 * Either source may be `undefined`; the other is returned unchanged.
	 * When both are present they are joined with `AND`.
	 *
	 * @param fields       - The Drizzle column map.
	 * @param optionsWhere - The where clause defined on the model options.
	 * @param stateWhere   - The where clause set via `.where()` at call-site.
	 * @returns The merged SQL condition, or `undefined`.
	 */
	compileEffective(
		fields: AnyRecord,
		optionsWhere: unknown,
		stateWhere: unknown
	): SQL | undefined {
		const base = this.compile(fields, optionsWhere);
		const extra = this.compile(fields, stateWhere);

		if (base && extra) {
			return and(base, extra);
		}

		return (base ?? extra) as SQL | undefined;
	}

	/**
	 * Compiles a plain object where clause against the table's column map.
	 *
	 * Each key in `where` is matched to a column in `fields`.
	 * The value is compiled via {@link compileColumnValue}.
	 *
	 * @param fields - The Drizzle column map.
	 * @param where  - A record of column-name → condition entries.
	 * @returns The combined `SQL` condition, or `undefined`.
	 */
	compileObject(fields: AnyRecord, where: AnyRecord): SQL | undefined {
		const parts: SQL[] = [];

		for (const [key, value] of Object.entries(where)) {
			if (value === undefined) {
				continue;
			}

			const column = fields[key];
			if (column) {
				const sql = this.compileColumnValue(column, value);
				if (sql) {
					parts.push(sql);
				}
				continue;
			}

			// TODO:
			if (value && typeof value === "object") {
				throw new Error(
					`Relation where is not implemented yet for key '${key}'.`
				);
			}
		}

		return this.combineWithAnd(parts);
	}

	/**
	 * Compiles a single column's condition into an SQL fragment.
	 *
	 * Supports:
	 * - Escaped values produced by `esc()`.
	 * - Operator objects (`{ eq, not, gt, in, like, … }`).
	 * - Logical combinators (`{ or: [...], and: [...] }`).
	 * - Plain scalar values (compiled as equality).
	 *
	 * @param column - The Drizzle column reference.
	 * @param value  - The condition value (scalar, operator object, or escaped).
	 * @returns A compiled `SQL` fragment, or `undefined`.
	 */
	compileColumnValue(column: unknown, value: unknown): SQL | undefined {
		if (this.isEscapedValue(value)) {
			return this.compileEscapedValue(column, value);
		}

		if (value && typeof value === "object" && !Array.isArray(value)) {
			return this.compileOperatorObject(column, value as AnyRecord);
		}

		return eq(column as SQL, value as SQL);
	}

	// ---------------------------------------------------------------------------
	// Private: operator compilation
	// ---------------------------------------------------------------------------

	/**
	 * Compiles an operator object (e.g. `{ gt: 5, lt: 10 }`) for a column.
	 *
	 * Iterates through all recognised operator keys and produces
	 * individual SQL fragments, then combines them with `AND`.
	 */
	private compileOperatorObject(
		column: unknown,
		value: AnyRecord
	): SQL | undefined {
		const parts: SQL[] = [];

		this.compileEquality(column, value, parts);
		this.compileComparison(column, value, parts);
		this.compileRange(column, value, parts);
		this.compilePattern(column, value, parts);
		this.compileSet(column, value, parts);
		this.compileNull(column, value, parts);
		this.compileLogical(column, value, parts);

		return this.combineWithAnd(parts);
	}

	/** Handles `eq` and `equal` operators. */
	private compileEquality(
		column: unknown,
		value: AnyRecord,
		parts: SQL[]
	): void {
		if ("eq" in value) {
			const u = this.unwrapEscaped(column, value.eq);
			this.pushIfDefined(parts, u.sql ?? eq(column as SQL, u.value as SQL));
		}
		if ("equal" in value) {
			const u = this.unwrapEscaped(column, value.equal);
			this.pushIfDefined(parts, u.sql ?? eq(column as SQL, u.value as SQL));
		}
		if ("not" in value) {
			const u = this.unwrapEscaped(column, value.not);
			this.pushIfDefined(parts, u.sql ?? ne(column as SQL, u.value as SQL));
		}
	}

	/** Handles `gt`, `gte`, `lt`, `lte` operators. */
	private compileComparison(
		column: unknown,
		value: AnyRecord,
		parts: SQL[]
	): void {
		if ("gt" in value) {
			const u = this.unwrapEscaped(column, value.gt);
			this.pushIfDefined(parts, u.sql ?? gt(column as SQL, u.value as SQL));
		}
		if ("gte" in value) {
			const u = this.unwrapEscaped(column, value.gte);
			this.pushIfDefined(parts, u.sql ?? gte(column as SQL, u.value as SQL));
		}
		if ("lt" in value) {
			const u = this.unwrapEscaped(column, value.lt);
			this.pushIfDefined(parts, u.sql ?? lt(column as SQL, u.value as SQL));
		}
		if ("lte" in value) {
			const u = this.unwrapEscaped(column, value.lte);
			this.pushIfDefined(parts, u.sql ?? lte(column as SQL, u.value as SQL));
		}
	}

	/** Handles `between` and `notBetween` operators. */
	private compileRange(column: unknown, value: AnyRecord, parts: SQL[]): void {
		if ("between" in value) {
			const pair = value.between as [unknown, unknown] | undefined;
			if (pair) {
				const a = this.unwrapEscaped(column, pair[0]);
				const b = this.unwrapEscaped(column, pair[1]);
				this.pushIfDefined(parts, a.sql);
				this.pushIfDefined(parts, b.sql);
				this.pushIfDefined(
					parts,
					between(column as SQL, a.value as SQL, b.value as SQL)
				);
			}
		}
		if ("notBetween" in value) {
			const pair = value.notBetween as [unknown, unknown] | undefined;
			if (pair) {
				const a = this.unwrapEscaped(column, pair[0]);
				const b = this.unwrapEscaped(column, pair[1]);
				this.pushIfDefined(parts, a.sql);
				this.pushIfDefined(parts, b.sql);
				this.pushIfDefined(
					parts,
					notBetween(column as SQL, a.value as SQL, b.value as SQL)
				);
			}
		}
	}

	/** Handles `like` and `ilike` operators. */
	private compilePattern(
		column: unknown,
		value: AnyRecord,
		parts: SQL[]
	): void {
		if ("like" in value) {
			const u = this.unwrapEscaped(column, value.like);
			this.pushIfDefined(
				parts,
				u.sql ?? like(column as SQL, u.value as string)
			);
		}
		if ("ilike" in value) {
			const u = this.unwrapEscaped(column, value.ilike);
			this.pushIfDefined(
				parts,
				u.sql ?? ilike(column as SQL, u.value as string)
			);
		}
	}

	/** Handles `in` and `nin` (not-in) operators. */
	private compileSet(column: unknown, value: AnyRecord, parts: SQL[]): void {
		if ("in" in value) {
			this.compileArrayOperator(column, value.in as unknown[], parts, inArray);
		}
		if ("nin" in value) {
			this.compileArrayOperator(
				column,
				value.nin as unknown[],
				parts,
				notInArray
			);
		}
	}

	/** Handles `isNull` operator. */
	private compileNull(column: unknown, value: AnyRecord, parts: SQL[]): void {
		if ("isNull" in value && value.isNull) {
			this.pushIfDefined(parts, isNull(column as SQL));
		}
	}

	/** Handles `or` and `and` logical combinators at the column level. */
	private compileLogical(
		column: unknown,
		value: AnyRecord,
		parts: SQL[]
	): void {
		if (Array.isArray(value.or)) {
			const sub = (value.or as unknown[])
				.map((item) => this.compileColumnValue(column, item))
				.filter(Boolean) as SQL[];
			if (sub.length > 0) {
				this.pushIfDefined(parts, or(...sub));
			}
		}

		if (Array.isArray(value.and)) {
			const sub = (value.and as unknown[])
				.map((item) => this.compileColumnValue(column, item))
				.filter(Boolean) as SQL[];
			if (sub.length > 0) {
				this.pushIfDefined(parts, and(...sub));
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Private: helpers
	// ---------------------------------------------------------------------------

	/**
	 * Compiles an array-based set operator (`IN` or `NOT IN`).
	 *
	 * Each element is unwrapped; raw SQL fragments are combined with `OR`,
	 * plain values are passed to the set operator.
	 */
	private compileArrayOperator(
		column: unknown,
		items: unknown[] | undefined,
		parts: SQL[],
		setFn: (col: SQL, values: unknown[]) => SQL
	): void {
		if (!items) {
			return;
		}

		const unwrapped = items.map((item) => this.unwrapEscaped(column, item));

		const sqlFragments = unwrapped.map((u) => u.sql).filter(Boolean) as SQL[];
		const plainValues = unwrapped
			.map((u) => u.value)
			.filter((v) => v !== undefined);

		if (sqlFragments.length > 0) {
			this.pushIfDefined(parts, or(...sqlFragments));
		}
		if (plainValues.length > 0) {
			this.pushIfDefined(parts, setFn(column as SQL, plainValues));
		}
	}

	/**
	 * Compiles an `esc()`-produced escaped value.
	 *
	 * If the escaped value carries an explicit operator, it is invoked
	 * with the column. Otherwise, implicit equality is applied.
	 */
	private compileEscapedValue(
		column: unknown,
		value: EscapedValue<unknown>
	): SQL {
		if ("__kind" in value && value.__kind === "esc-op") {
			const escaped = value as {
				op: (col: unknown, val: unknown) => SQL;
				value: unknown;
			};
			return escaped.op(column, escaped.value);
		}

		return eq(column as SQL, (value as { equal: unknown }).equal as SQL);
	}

	/**
	 * Unwraps a potentially escaped value into either a raw SQL fragment
	 * or a plain value suitable for parameterised queries.
	 */
	private unwrapEscaped(column: unknown, value: unknown): UnwrappedValue {
		if (!this.isEscapedValue(value)) {
			return { value };
		}

		if ("__kind" in value && value.__kind === "esc-op") {
			const escaped = value as {
				op: (col: unknown, val: unknown) => SQL;
				value: unknown;
			};
			return { sql: escaped.op(column, escaped.value) };
		}

		return { value: (value as { equal: unknown }).equal };
	}

	/** Checks whether a value is an `esc()` descriptor. */
	private isEscapedValue(value: unknown): value is EscapedValue<unknown> {
		return (
			!!value &&
			typeof value === "object" &&
			("equal" in value || (value as AnyRecord).__kind === "esc-op")
		);
	}

	/** Checks whether a value exposes a Drizzle `.getSQL()` method. */
	private isDrizzleSql(value: unknown): boolean {
		return (
			!!value &&
			typeof value === "object" &&
			typeof (value as AnyRecord).getSQL === "function"
		);
	}

	/** Checks whether a value is thenable (a promise). */
	private isPromiseLike(value: unknown): value is PromiseLike<unknown> {
		return (
			!!value &&
			(typeof value === "object" || typeof value === "function") &&
			typeof (value as PromiseLike<unknown>).then === "function"
		);
	}

	/** Pushes an SQL fragment into `parts` only when it is defined. */
	private pushIfDefined(parts: SQL[], sql: SQL | undefined): void {
		if (sql) {
			parts.push(sql);
		}
	}

	/**
	 * Combines an array of SQL fragments with `AND`.
	 *
	 * Returns `undefined` for an empty array, the single element
	 * for a one-item array, or a full `AND(…)` expression otherwise.
	 */
	private combineWithAnd(parts: SQL[]): SQL | undefined {
		if (parts.length === 0) {
			return undefined;
		}
		return parts.length === 1 ? parts[0] : and(...parts);
	}
}
