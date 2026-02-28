/** Generic record type. */
type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Safe result wrapper
// ---------------------------------------------------------------------------

/**
 * A discriminated union that wraps a result with error handling.
 *
 * When the operation succeeds, `data` contains the value and `error`
 * is `undefined`. When it fails, `error` contains the thrown value
 * and `data` is `undefined`.
 */
export type SafeResult<T> =
	| { data: T; error: undefined }
	| { data: undefined; error: unknown };

// ---------------------------------------------------------------------------
// Query state
// ---------------------------------------------------------------------------

/** Accumulated state for a query operation (findMany / findFirst). */
export interface QueryState {
	/** Column blacklist for `.exclude()`. */
	exclude?: AnyRecord;
	/** When `true`, formatting is skipped. */
	raw?: boolean;
	/** When `true`, result is wrapped in `{ data, error }`. */
	safe?: boolean;
	/** Column whitelist for `.select()`. */
	select?: AnyRecord;
	/** Compiled where clause. */
	where?: unknown;
	/** Relation inclusions (`.with()` value). */
	with?: unknown;
}

// ---------------------------------------------------------------------------
// Mutate state
// ---------------------------------------------------------------------------

/** Discriminator for mutation kinds. */
export type MutateKind = "insert" | "update" | "delete" | "upsert";

/** Accumulated state for a mutation operation. */
export interface MutateState {
	/** When `true`, `.return()` or `.returnFirst()` was called. */
	hasReturn?: boolean;
	/** The kind of mutation being performed. */
	kind: MutateKind;
	/** Post-query key exclusion map for `.omit()`. */
	omit?: AnyRecord;
	/** When `true`, only the first element of the returning array is returned. */
	returnFirst?: boolean;
	/** Column selection for `.returning()`. */
	returnSelect?: AnyRecord;
	/** When `true`, result is wrapped in `{ data, error }`. */
	safe?: boolean;
	/** The payload value (insert data, update set, upsert descriptor). */
	value?: unknown;
	/** Compiled where clause (for update / delete). */
	where?: unknown;
}

// ---------------------------------------------------------------------------
// ThenableResult — base class
// ---------------------------------------------------------------------------

/**
 * A lazy result that implements `PromiseLike` so it can be `await`-ed.
 *
 * Execution is deferred until `.then()` is called, allowing the caller
 * to chain modifiers (`.select()`, `.with()`, …) before the query runs.
 *
 * When `_safe` is `true`, execution errors are caught and the result
 * is wrapped in a {@link SafeResult} discriminated union.
 *
 * @typeParam T - The resolved result type.
 */
export class ThenableResult<T> implements PromiseLike<T> {
	/** The deferred execution function. */
	protected readonly _execute: () => Promise<T>;

	/** When `true`, wraps the result in `{ data, error }`. */
	protected readonly _safe: boolean;

	constructor(execute: () => Promise<T>, safe = false) {
		this._execute = execute;
		this._safe = safe;
	}

	/**
	 * Implements the `PromiseLike` interface.
	 *
	 * Triggers the deferred execution and forwards to the native
	 * `Promise.then()`. When `_safe` is enabled, catches errors and
	 * resolves to `{ data, error }` instead of rejecting.
	 */
	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
	): Promise<TResult1 | TResult2> {
		if (!this._safe) {
			return this._execute().then(
				onfulfilled as (value: T) => TResult1 | PromiseLike<TResult1>,
				onrejected as (reason: unknown) => TResult2 | PromiseLike<TResult2>
			);
		}

		return this._execute()
			.then((data) => ({ data, error: undefined }) as unknown as T)
			.catch((error: unknown) => ({ data: undefined, error }) as unknown as T)
			.then(
				onfulfilled as (value: T) => TResult1 | PromiseLike<TResult1>,
				onrejected as (reason: unknown) => TResult2 | PromiseLike<TResult2>
			);
	}
}

// ---------------------------------------------------------------------------
// QueryResult
// ---------------------------------------------------------------------------

/**
 * A thenable query result that supports chaining query modifiers.
 *
 * Each modifier returns a **new** `QueryResult` with the updated state,
 * keeping the original immutable.
 *
 * @typeParam T - The resolved result type.
 */
export class QueryResult<T> extends ThenableResult<T> {
	/** The current accumulated query state. */
	private readonly state: QueryState;

	/** The runner function that executes the query with the given state. */
	private readonly runner: (state: QueryState) => Promise<T>;

	constructor(state: QueryState, runner: (state: QueryState) => Promise<T>) {
		super(() => runner(state), state.safe);
		this.state = state;
		this.runner = runner;
	}

	/**
	 * Includes related entities via LEFT JOINs.
	 *
	 * @param value - A relation selection map (e.g. `{ posts: true }`).
	 * @returns A new `QueryResult` with the `.with()` state applied.
	 */
	with(value: AnyRecord): QueryResult<T> {
		return new QueryResult({ ...this.state, with: value }, this.runner);
	}

	/**
	 * Whitelists specific fields in the result.
	 *
	 * @param value - A map of `{ fieldName: true }`.
	 * @returns A new `QueryResult` with the `.select()` state applied.
	 */
	select(value: AnyRecord): QueryResult<T> {
		return new QueryResult({ ...this.state, select: value }, this.runner);
	}

	/**
	 * Blacklists specific fields from the result.
	 *
	 * @param value - A map of `{ fieldName: true }`.
	 * @returns A new `QueryResult` with the `.exclude()` state applied.
	 */
	exclude(value: AnyRecord): QueryResult<T> {
		return new QueryResult({ ...this.state, exclude: value }, this.runner);
	}

	/**
	 * Disables format transformations for this query.
	 *
	 * @returns A new `QueryResult` with `raw` set to `true`.
	 */
	raw(): QueryResult<T> {
		return new QueryResult({ ...this.state, raw: true }, this.runner);
	}

	/**
	 * Wraps the result in a `{ data, error }` discriminated union.
	 *
	 * When the query succeeds, resolves to `{ data: T, error: undefined }`.
	 * When it fails, resolves to `{ data: undefined, error: unknown }`
	 * instead of rejecting.
	 *
	 * @returns A new `QueryResult` with safe error handling enabled.
	 */
	safe(): QueryResult<SafeResult<T>> {
		return new QueryResult(
			{ ...this.state, safe: true },
			this.runner as (state: QueryState) => Promise<SafeResult<T>>
		);
	}

	/**
	 * Returns the current query state for debugging purposes.
	 *
	 * @returns The accumulated {@link QueryState}.
	 */
	debug(): QueryState {
		return this.state;
	}
}

// ---------------------------------------------------------------------------
// MutateResult
// ---------------------------------------------------------------------------

/**
 * A thenable mutation result that supports chaining mutation modifiers.
 *
 * Each modifier returns a **new** `MutateResult` with the updated state,
 * keeping the original immutable.
 *
 * @typeParam T - The resolved result type.
 */
export class MutateResult<T> extends ThenableResult<T> {
	/** The current accumulated mutation state. */
	private readonly state: MutateState;

	/** The runner function that executes the mutation with the given state. */
	private readonly runner: (state: MutateState) => Promise<T>;

	constructor(state: MutateState, runner: (state: MutateState) => Promise<T>) {
		super(() => runner(state), state.safe);
		this.state = state;
		this.runner = runner;
	}

	/**
	 * Specifies which columns to return from the mutation (as an array).
	 *
	 * @param value - Optional column selection map for `.returning()`.
	 * @returns A new `MutateResult` with the return selection applied.
	 */
	return(value?: AnyRecord): MutateResult<T> {
		return new MutateResult(
			{ ...this.state, returnSelect: value, hasReturn: true },
			this.runner
		);
	}

	/**
	 * Specifies which columns to return, resolving to only the **first** row.
	 *
	 * Behaves like `.return()` but unwraps the array to a single object.
	 *
	 * @param value - Optional column selection map for `.returning()`.
	 * @returns A new `MutateResult` with `returnFirst` enabled.
	 */
	returnFirst(value?: AnyRecord): MutateResult<T> {
		return new MutateResult(
			{
				...this.state,
				returnSelect: value,
				returnFirst: true,
				hasReturn: true,
			},
			this.runner
		);
	}

	/**
	 * Excludes specific fields from the mutation result **after** execution.
	 *
	 * Unlike `.exclude()` on queries (which affects the SQL projection),
	 * `.omit()` removes keys from the result objects in-memory.
	 *
	 * @param value - A map of `{ fieldName: true }` for fields to remove.
	 * @returns A new `MutateResult` with the omit map applied.
	 */
	omit(value: AnyRecord): MutateResult<T> {
		return new MutateResult({ ...this.state, omit: value }, this.runner);
	}

	/**
	 * Wraps the result in a `{ data, error }` discriminated union.
	 *
	 * When the mutation succeeds, resolves to `{ data: T, error: undefined }`.
	 * When it fails, resolves to `{ data: undefined, error: unknown }`
	 * instead of rejecting.
	 *
	 * @returns A new `MutateResult` with safe error handling enabled.
	 */
	safe(): MutateResult<SafeResult<T>> {
		return new MutateResult(
			{ ...this.state, safe: true },
			this.runner as (state: MutateState) => Promise<SafeResult<T>>
		);
	}
}
