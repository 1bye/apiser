import type { ModelDialect } from "../model/dialect.ts";
import type { ModelOptions } from "../model/options.ts";
import { DialectHelper } from "./dialect.ts";
import { JoinExecutor } from "./query/joins.ts";
import { OrderByCompiler } from "./query/orderby.ts";
import { ProjectionBuilder } from "./query/projection.ts";
import { WhereCompiler } from "./query/where.ts";
import {
	type MutateKind,
	MutateResult,
	type MutateState,
	QueryResult,
	type QueryState,
} from "./result.ts";
import { ResultTransformer } from "./transform.ts";

/** Generic record type used throughout the runtime. */
type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration required to construct a {@link ModelRuntime}.
 *
 * Carries all the static metadata about the table, schema, relations,
 * dialect and user-defined options.
 */
export interface ModelRuntimeConfig {
	/** The Drizzle database instance. */
	db: unknown;
	/** The SQL dialect of the database. */
	dialect: ModelDialect;
	/** User-defined model options (format, methods, where, …). */
	options: ModelOptions<never, never, never, never>;
	/** The Drizzle relations metadata map. */
	relations: Record<string, AnyRecord>;
	/** The full schema map (`{ tableName: drizzleTable }`). */
	schema: Record<string, AnyRecord>;
	/** The name of the table this model represents. */
	tableName: string;
}

// ---------------------------------------------------------------------------
// ModelRuntime
// ---------------------------------------------------------------------------

/**
 * The runtime implementation behind every model instance.
 *
 * Exposes query methods (`findMany`, `findFirst`), mutation methods
 * (`insert`, `update`, `delete`, `upsert`), and lifecycle helpers
 * (`where`, `extend`, `db`, `include`).
 *
 * Internally delegates to specialised helpers:
 * - {@link WhereCompiler} — compiles where clauses.
 * - {@link ProjectionBuilder} — builds column projections.
 * - {@link JoinExecutor} — executes relation joins.
 * - {@link ResultTransformer} — applies post-query transforms.
 *
 * Each call to `.where()` returns a **new** runtime with the additional
 * filter applied, keeping the original immutable.
 */
export class ModelRuntime {
	/** Static configuration for this model. */
	private readonly config: ModelRuntimeConfig;

	/** The current where filter applied via `.where()`. */
	private readonly currentWhere: unknown;

	/** The current order by clause applied via `.orderBy()`. */
	private readonly currentOrderBy: unknown;

	/** The current limit value applied via `.limit()`. */
	private readonly currentLimit: number | undefined;

	/** The current select projection applied via `.select()`. */
	private readonly currentSelect: AnyRecord | undefined;

	/** The current exclude projection applied via `.exclude()`. */
	private readonly currentExclude: AnyRecord | undefined;

	// Shared helpers (stateless, safe to reuse)
	private readonly whereCompiler: WhereCompiler;
	private readonly projection: ProjectionBuilder;
	private readonly joinExecutor: JoinExecutor;
	private readonly transformer: ResultTransformer;
	private readonly dialectHelper: DialectHelper;
	private readonly orderByCompiler: OrderByCompiler;

	constructor(
		config: ModelRuntimeConfig,
		currentWhere?: unknown,
		currentOrderBy?: unknown,
		currentLimit?: number,
		currentSelect?: AnyRecord,
		currentExclude?: AnyRecord
	) {
		this.config = config;
		this.currentWhere = currentWhere;
		this.currentOrderBy = currentOrderBy;
		this.currentLimit = currentLimit;
		this.currentSelect = currentSelect;
		this.currentExclude = currentExclude;

		this.dialectHelper = new DialectHelper(config.dialect);
		this.whereCompiler = new WhereCompiler();
		this.orderByCompiler = new OrderByCompiler();
		this.projection = new ProjectionBuilder();
		this.joinExecutor = new JoinExecutor(this.dialectHelper);
		this.transformer = new ResultTransformer();
	}

	// ---------------------------------------------------------------------------
	// Public: identity & meta
	// ---------------------------------------------------------------------------

	/** Model discriminator tag. */
	get $model(): "model" {
		return "model";
	}

	/** The name of the table this model is bound to. */
	get $modelName(): string {
		return this.config.tableName;
	}

	/** The user-defined format function, if any. */
	get $format(): unknown {
		return this.config.options.format;
	}

	/** The current where clause, exposed for relation descriptors. */
	get $where(): unknown {
		return this.currentWhere;
	}

	/** The table name this model is bound to, exposed for relation descriptors. */
	get $tableName(): string {
		return this.config.tableName;
	}

	// ---------------------------------------------------------------------------
	// Public: filtering
	// ---------------------------------------------------------------------------

	/**
	 * Returns a new runtime with an additional where filter.
	 *
	 * The new filter is AND-ed with any existing model-level where clause
	 * at execution time.
	 *
	 * @param value - A where clause (object, SQL, or model reference).
	 * @returns A new {@link ModelRuntime} with the filter applied.
	 */
	where(value: unknown): ModelRuntime {
		return new ModelRuntime(
			this.config,
			value,
			this.currentOrderBy,
			this.currentLimit,
			this.currentSelect,
			this.currentExclude
		);
	}

	// ---------------------------------------------------------------------------
	// Public: lifecycle
	// ---------------------------------------------------------------------------

	/**
	 * Returns a relation descriptor carrying the model's where clause
	 * and the nested relation includes.
	 *
	 * Used in `.with()` to filter a relation and load nested relations:
	 * ```ts
	 * userModel.findMany().with({
	 *   posts: postModel.where({ ... }).include({ comments: true }),
	 * });
	 * ```
	 *
	 * @param value - The nested relation include descriptor.
	 * @returns A model relation descriptor consumed by the join executor.
	 */
	include(value: unknown): unknown {
		return {
			__modelRelation: true,
			whereValue: this.currentWhere,
			tableName: this.config.tableName,
			with: value,
		};
	}

	/**
	 * Creates a new runtime with merged options.
	 *
	 * Useful for extending a base model with additional format functions,
	 * methods, or default where clauses.
	 *
	 * @param nextOptions - Partial options to merge.
	 * @returns A new {@link ModelRuntime} with the merged configuration.
	 */
	extend(
		nextOptions: Partial<ModelOptions<never, never, never, never>>
	): ModelRuntime {
		return new ModelRuntime(
			{
				...this.config,
				options: {
					...this.config.options,
					...nextOptions,
					methods: {
						...(this.config.options.methods ?? {}),
						...(nextOptions.methods ?? {}),
					},
					format: nextOptions.format ?? this.config.options.format,
				} as ModelOptions<never, never, never, never>,
			},
			this.currentWhere,
			this.currentOrderBy,
			this.currentLimit,
			this.currentSelect,
			this.currentExclude
		);
	}

	/**
	 * Creates a new runtime bound to a different database instance.
	 *
	 * @param db - The new Drizzle database instance.
	 * @returns A new {@link ModelRuntime} using the given database.
	 */
	db(db: unknown): ModelRuntime {
		return new ModelRuntime(
			{ ...this.config, db },
			this.currentWhere,
			this.currentOrderBy,
			this.currentLimit,
			this.currentSelect,
			this.currentExclude
		);
	}

	// ---------------------------------------------------------------------------
	// Public: query modifiers (model-level)
	// ---------------------------------------------------------------------------

	/**
	 * Returns a new runtime with an order-by clause for sorting results.
	 *
	 * Supports two syntaxes:
	 * - Object: `{ age: 'desc', name: 'asc' }`
	 * - Drizzle: `asc(table.age)`, `desc(table.age)`, or array `[desc(table.age), asc(table.name)]`
	 *
	 * @param value - The order specification.
	 * @returns A new {@link ModelRuntime} with the order applied.
	 */
	orderBy(value: unknown): ModelRuntime {
		return new ModelRuntime(
			this.config,
			this.currentWhere,
			value,
			this.currentLimit,
			this.currentSelect,
			this.currentExclude
		);
	}

	/**
	 * Returns a new runtime with a limit on the number of rows returned.
	 *
	 * @param n - The maximum number of rows to return.
	 * @returns A new {@link ModelRuntime} with the limit applied.
	 */
	limit(n: number): ModelRuntime {
		return new ModelRuntime(
			this.config,
			this.currentWhere,
			this.currentOrderBy,
			n,
			this.currentSelect,
			this.currentExclude
		);
	}

	/**
	 * Returns a new runtime with a column selection (SQL SELECT whitelist).
	 *
	 * Supports two syntaxes:
	 * - Object: `{ name: true, email: true }`
	 * - Array: `['name', 'email']`
	 *
	 * @param value - The columns to select.
	 * @returns A new {@link ModelRuntime} with the selection applied.
	 */
	select(value: AnyRecord | string[]): ModelRuntime {
		// Convert array syntax to object syntax
		const selectValue: AnyRecord = Array.isArray(value)
			? Object.fromEntries(value.map((key) => [key, true]))
			: value;
		return new ModelRuntime(
			this.config,
			this.currentWhere,
			this.currentOrderBy,
			this.currentLimit,
			selectValue,
			this.currentExclude
		);
	}

	/**
	 * Returns a new runtime with column exclusions (SQL SELECT blacklist).
	 *
	 * @param value - A map of `{ columnName: true }` for columns to exclude.
	 * @returns A new {@link ModelRuntime} with the exclusions applied.
	 */
	exclude(value: AnyRecord): ModelRuntime {
		return new ModelRuntime(
			this.config,
			this.currentWhere,
			this.currentOrderBy,
			this.currentLimit,
			this.currentSelect,
			value
		);
	}

	// ---------------------------------------------------------------------------
	// Public: queries
	// ---------------------------------------------------------------------------

	/**
	 * Returns a thenable that resolves to an array of matching rows.
	 *
	 * Supports chaining: `.select()`, `.exclude()` (SQL SELECT),
	 * `.with()` (relations), `.raw()`, `.safe()`.
	 *
	 * @returns A {@link QueryResult} that can be awaited or further chained.
	 */
	findMany(): QueryResult<unknown> {
		const runner = async (qState: QueryState): Promise<unknown> => {
			const table = this.getTable();
			const whereSql = this.buildEffectiveWhere(table);

			// Merge model-level state with query-level state
			const effectiveSelect = qState.select ?? this.currentSelect;
			const effectiveExclude = qState.exclude ?? this.currentExclude;
			const effectiveOrderBy = qState.orderBy ?? this.currentOrderBy;
			const effectiveLimit = qState.limit ?? this.currentLimit;

			let result: unknown;

			if (qState.with) {
				result = await this.joinExecutor.execute({
					db: this.config.db,
					schema: this.config.schema,
					relations: this.config.relations,
					baseTableName: this.config.tableName,
					baseTable: table,
					whereSql,
					withValue: qState.with as AnyRecord,
					select: effectiveSelect,
					exclude: effectiveExclude,
					orderBy: effectiveOrderBy,
					limit: effectiveLimit,
					limitOne: false,
				});
			} else {
				const { selectMap } = this.projection.build(
					table,
					effectiveSelect,
					effectiveExclude
				);
				const db = this.config.db as AnyRecord;
				let query = (db.select as (m: AnyRecord) => AnyRecord)(selectMap);
				query = (
					query as AnyRecord & { from: (t: AnyRecord) => AnyRecord }
				).from(table);

				if (whereSql) {
					query = (
						query as AnyRecord & { where: (w: unknown) => AnyRecord }
					).where(whereSql);
				}

				// Apply orderBy if present
				if (effectiveOrderBy) {
					const orderClauses = this.orderByCompiler.compile(
						table,
						effectiveOrderBy as import("./query/orderby.ts").OrderByValue
					);
					if (orderClauses && orderClauses.length > 0) {
						query = (
							query as AnyRecord & {
								orderBy: (...args: unknown[]) => AnyRecord;
							}
						).orderBy(...orderClauses);
					}
				}

				// Apply limit if present
				if (effectiveLimit !== undefined && effectiveLimit > 0) {
					query = (
						query as AnyRecord & { limit: (n: number) => AnyRecord }
					).limit(effectiveLimit);
				}

				result = await (query as unknown as PromiseLike<unknown>);
			}

			return this.applyPostQueryTransforms(result, qState);
		};

		return new QueryResult({} as QueryState, runner);
	}

	/**
	 * Returns a thenable that resolves to the first matching row (or `undefined`).
	 *
	 * Supports chaining: `.select()`, `.exclude()` (SQL SELECT),
	 * `.with()` (relations), `.raw()`, `.safe()`.
	 *
	 * @returns A {@link QueryResult} that can be awaited or further chained.
	 */
	findFirst(): QueryResult<unknown> {
		const runner = async (qState: QueryState): Promise<unknown> => {
			const table = this.getTable();
			const whereSql = this.buildEffectiveWhere(table);

			// Merge model-level state with query-level state
			const effectiveSelect = qState.select ?? this.currentSelect;
			const effectiveExclude = qState.exclude ?? this.currentExclude;
			const effectiveOrderBy = qState.orderBy ?? this.currentOrderBy;
			// findFirst always limits to 1, but model-level limit is respected if specified
			const effectiveLimit = qState.limit ?? this.currentLimit;

			let result: unknown;

			if (qState.with) {
				result = await this.joinExecutor.execute({
					db: this.config.db,
					schema: this.config.schema,
					relations: this.config.relations,
					baseTableName: this.config.tableName,
					baseTable: table,
					whereSql,
					withValue: qState.with as AnyRecord,
					select: effectiveSelect,
					exclude: effectiveExclude,
					orderBy: effectiveOrderBy,
					limit: effectiveLimit,
					limitOne: true,
				});
			} else {
				const { selectMap } = this.projection.build(
					table,
					effectiveSelect,
					effectiveExclude
				);
				const db = this.config.db as AnyRecord;
				let query = (db.select as (m: AnyRecord) => AnyRecord)(selectMap);
				query = (
					query as AnyRecord & { from: (t: AnyRecord) => AnyRecord }
				).from(table);

				if (whereSql) {
					query = (
						query as AnyRecord & { where: (w: unknown) => AnyRecord }
					).where(whereSql);
				}

				// Apply orderBy if present
				if (effectiveOrderBy) {
					const orderClauses = this.orderByCompiler.compile(
						table,
						effectiveOrderBy as import("./query/orderby.ts").OrderByValue
					);
					if (orderClauses && orderClauses.length > 0) {
						query = (
							query as AnyRecord & {
								orderBy: (...args: unknown[]) => AnyRecord;
							}
						).orderBy(...orderClauses);
					}
				}

				query = (
					query as AnyRecord & { limit: (n: number) => AnyRecord }
				).limit(1);
				const rows = (await (query as unknown as PromiseLike<
					unknown[]
				>)) as unknown[];
				result = rows[0];
			}

			return this.applyPostQueryTransforms(result, qState);
		};

		return new QueryResult({} as QueryState, runner);
	}

	/**
	 * Returns a promise that resolves to the number of matching rows.
	 *
	 * Respects the effective where clause (model-level + `.where()`).
	 *
	 * @returns A `Promise<number>` with the row count.
	 */
	async count(): Promise<number> {
		const table = this.getTable();
		const whereSql = this.buildEffectiveWhere(table);

		const db = this.config.db as AnyRecord;
		const { count: countFn } = await import("drizzle-orm");

		let query = (db.select as (m: AnyRecord) => AnyRecord)({
			count: countFn(),
		});
		query = (query as AnyRecord & { from: (t: AnyRecord) => AnyRecord }).from(
			table
		);

		if (whereSql) {
			query = (query as AnyRecord & { where: (w: unknown) => AnyRecord }).where(
				whereSql
			);
		}

		const rows = (await (query as unknown as PromiseLike<
			AnyRecord[]
		>)) as AnyRecord[];
		return (rows[0]?.count as number) ?? 0;
	}

	// ---------------------------------------------------------------------------
	// Public: mutations
	// ---------------------------------------------------------------------------

	/**
	 * Inserts one or more rows into the table.
	 *
	 * @param value - The row(s) to insert.
	 * @returns A {@link MutateResult} that can be awaited or chained with `.return()`.
	 */
	insert(value: unknown): MutateResult<unknown> {
		const runner = async (mState: MutateState): Promise<unknown> => {
			const table = this.getTable();
			const db = this.config.db as AnyRecord;
			const query = (db.insert as (t: AnyRecord) => AnyRecord)(table);
			const withValues = (
				query as AnyRecord & { values: (v: unknown) => unknown }
			).values(mState.value);

			let result = await this.execReturning(withValues, mState);

			if (
				!(mState.hasReturn || Array.isArray(mState.value)) &&
				Array.isArray(result)
			) {
				result = (result as unknown[])[0];
			}

			return this.applyPostMutateTransforms(result, mState);
		};

		return new MutateResult({ kind: "insert" as MutateKind, value }, runner);
	}

	/**
	 * Updates rows matching the current where clause.
	 *
	 * @param value - The partial row data to set.
	 * @returns A {@link MutateResult} that can be awaited or chained with `.return()`.
	 */
	update(value: unknown): MutateResult<unknown> {
		const runner = async (mState: MutateState): Promise<unknown> => {
			const table = this.getTable();
			const whereSql = this.buildEffectiveWhere(table);
			const db = this.config.db as AnyRecord;

			let query: unknown = (db.update as (t: AnyRecord) => AnyRecord)(table);
			query = (query as AnyRecord & { set: (v: unknown) => unknown }).set(
				mState.value
			);

			if (whereSql) {
				query = (query as AnyRecord & { where: (w: unknown) => unknown }).where(
					whereSql
				);
			}

			const result = await this.execReturning(query, mState);
			return this.applyPostMutateTransforms(result, mState);
		};

		return new MutateResult({ kind: "update" as MutateKind, value }, runner);
	}

	/**
	 * Deletes rows matching the current where clause.
	 *
	 * @returns A {@link MutateResult} that can be awaited or chained with `.return()`.
	 */
	delete(): MutateResult<unknown> {
		const runner = async (mState: MutateState): Promise<unknown> => {
			const table = this.getTable();
			const whereSql = this.buildEffectiveWhere(table);
			const db = this.config.db as AnyRecord;

			let query: unknown = (db.delete as (t: AnyRecord) => unknown)(table);

			if (whereSql) {
				query = (query as AnyRecord & { where: (w: unknown) => unknown }).where(
					whereSql
				);
			}

			const result = await this.execReturning(query, mState);
			return this.applyPostMutateTransforms(result, mState);
		};

		return new MutateResult({ kind: "delete" as MutateKind }, runner);
	}

	/**
	 * Inserts a row, or updates it when a conflict is detected.
	 *
	 * The `value` must contain `insert`, `update`, and optionally `target`.
	 *
	 * @param value - The upsert descriptor.
	 * @returns A {@link MutateResult} that can be awaited or chained with `.return()`.
	 */
	upsert(value: unknown): MutateResult<unknown> {
		const runner = async (mState: MutateState): Promise<unknown> => {
			const table = this.getTable();
			const upsertValue = mState.value as AnyRecord;

			const insertValues = upsertValue.insert;
			const updateCfg = upsertValue.update;
			const target = this.normalizeUpsertTarget(table, upsertValue.target);

			let updateSet = updateCfg;
			if (typeof updateCfg === "function") {
				updateSet = (updateCfg as (ctx: AnyRecord) => unknown)({
					excluded: (field: string) => (table as AnyRecord)[field],
					inserted: (field: string) => (table as AnyRecord)[field],
				});
			}

			const db = this.config.db as AnyRecord;
			let query: unknown = (db.insert as (t: AnyRecord) => AnyRecord)(table);
			query = (query as AnyRecord & { values: (v: unknown) => unknown }).values(
				insertValues
			);

			const queryRecord = query as AnyRecord;
			if (typeof queryRecord.onConflictDoUpdate === "function") {
				query = (queryRecord.onConflictDoUpdate as (cfg: AnyRecord) => unknown)(
					{
						target,
						set: updateSet,
					}
				);
			}

			const result = await this.execReturning(query, mState);
			return this.applyPostMutateTransforms(result, mState);
		};

		return new MutateResult({ kind: "upsert" as MutateKind, value }, runner);
	}

	// ---------------------------------------------------------------------------
	// Public: method attachment
	// ---------------------------------------------------------------------------

	/**
	 * Attaches user-defined methods from the model options to a target object.
	 *
	 * Each method is bound to `target` so that `this` inside the method
	 * refers to the model-like object.
	 *
	 * @param target - The object to attach methods to.
	 */
	attachMethods(target: AnyRecord): void {
		const methods = this.config.options.methods;
		if (!methods) {
			return;
		}

		for (const [key, fn] of Object.entries(methods)) {
			if (typeof fn === "function") {
				target[key] = (fn as (...args: unknown[]) => unknown).bind(target);
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Private: helpers
	// ---------------------------------------------------------------------------

	/**
	 * Applies `returnFirst` and `omit` transforms to a mutation result.
	 */
	private applyPostMutateTransforms(
		result: unknown,
		mState: MutateState
	): unknown {
		let out = result;

		if (mState.returnFirst && Array.isArray(out)) {
			out = (out as unknown[])[0];
		}

		if (mState.omit) {
			out = this.transformer.applyExclude(out, mState.omit);
		}

		return out;
	}

	/**
	 * Retrieves the Drizzle table object for the configured table name.
	 */
	private getTable(): AnyRecord {
		return this.config.schema[this.config.tableName] as AnyRecord;
	}

	/**
	 * Builds the effective where clause by merging the model-level where
	 * (from options) with the call-level where (from `.where()`).
	 */
	private buildEffectiveWhere(table: AnyRecord): unknown {
		return this.whereCompiler.compileEffective(
			table,
			this.config.options.where,
			this.currentWhere
		);
	}

	/**
	 * Applies post-query transforms to the query result.
	 *
	 * Note: `.select()` and `.exclude()` are handled at the SQL level
	 * (via {@link ProjectionBuilder}) and are NOT applied here.
	 * Only format transforms are applied post-query.
	 */
	private applyPostQueryTransforms(
		result: unknown,
		qState: QueryState
	): unknown {
		let out = result;

		if (!qState.raw) {
			out = this.transformer.applyFormat(
				out,
				this.config.options.format as ((row: AnyRecord) => unknown) | undefined
			);
		}

		return out;
	}

	/**
	 * Executes the returning clause for a mutation query.
	 *
	 * Handles the dialect-specific differences:
	 * - Standard `.returning()` (PostgreSQL, SQLite).
	 * - `.$returningId()` (MySQL, SingleStore, CockroachDB).
	 *
	 * @param query  - The built mutation query.
	 * @param mState - The mutation state (may contain `returnSelect`).
	 * @returns The mutation result.
	 */
	private async execReturning(
		query: unknown,
		mState: MutateState
	): Promise<unknown> {
		const queryRecord = query as AnyRecord;

		if (typeof queryRecord.returning === "function") {
			return mState.returnSelect
				? await (
						queryRecord.returning as (sel: AnyRecord) => PromiseLike<unknown>
					)(mState.returnSelect)
				: await (queryRecord.returning as () => PromiseLike<unknown>)();
		}

		if (
			this.dialectHelper.isReturningIdOnly() &&
			typeof queryRecord.$returningId === "function"
		) {
			return await (queryRecord.$returningId as () => PromiseLike<unknown>)();
		}

		return await (query as PromiseLike<unknown>);
	}

	/**
	 * Normalizes the upsert conflict target.
	 *
	 * Converts string column names to their Drizzle column references,
	 * handling both single values and arrays.
	 */
	private normalizeUpsertTarget(table: AnyRecord, target: unknown): unknown {
		if (!target) {
			return target;
		}

		if (typeof target === "string") {
			return table[target] ?? target;
		}

		if (Array.isArray(target)) {
			return target.map((t) => (typeof t === "string" ? (table[t] ?? t) : t));
		}

		return target;
	}
}
