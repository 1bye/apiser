import type { MethodExcludeValue } from "../methods/exclude.ts";
import type { MethodSelectValue } from "../methods/select.ts";
import type { MethodWithValue } from "../methods/with.ts";

type AnyObj = Record<string, any>;

type QueryState = {
	where?: unknown;
	with?: unknown;
	raw?: boolean;
	select?: AnyObj;
	exclude?: AnyObj;
};

type MutateKind = "insert" | "update" | "delete" | "upsert";

type MutateState = {
	kind: MutateKind;
	where?: unknown;
	value?: unknown;
	returnSelect?: AnyObj;
};

export class ThenableResult<T> implements PromiseLike<T> {
	protected _execute: () => Promise<T>;

	constructor(execute: () => Promise<T>) {
		this._execute = execute;
	}

	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
	): Promise<TResult1 | TResult2> {
		return this._execute().then(onfulfilled as any, onrejected as any);
	}
}

export class QueryResult<T> extends ThenableResult<T> {
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
		return new QueryResult(
			{ ...this.state, select: value as any },
			this.runner
		) as any;
	}

	exclude(value: MethodExcludeValue<any>): any {
		return new QueryResult(
			{ ...this.state, exclude: value as any },
			this.runner
		) as any;
	}

	raw(): any {
		return new QueryResult({ ...this.state, raw: true }, this.runner) as any;
	}

	debug(): any {
		return this.state;
	}
}

export class MutateResult<T> extends ThenableResult<T> {
	private state: MutateState;
	private runner: (state: MutateState) => Promise<T>;

	constructor(state: MutateState, runner: (state: MutateState) => Promise<T>) {
		super(() => runner(state));
		this.state = state;
		this.runner = runner;
	}

	return(value?: AnyObj): any {
		return new MutateResult(
			{ ...this.state, returnSelect: value },
			this.runner
		) as any;
	}
}

export type { QueryState, MutateState, MutateKind };
