import type { MethodSelectValue } from "./select";

export type ResolveMethodExcludeValue<
	TValue extends Record<string, any>,
	TResult extends Record<string, any>,
> = {
	[Key in keyof TResult as TValue[Key & string] extends true
		? never
		: Key]: TValue[Key & string] extends object
		? TResult[Key & string] extends (infer RItem)[]
			? RItem extends Record<string, any>
				? ResolveMethodExcludeValue<TValue[Key & string], RItem>[]
				: never
			: TResult[Key & string] extends Record<string, any>
				? ResolveMethodExcludeValue<TValue[Key & string], TResult[Key & string]>
				: never
		: TResult[Key & string];
};

export type MethodExcludeResult<
	TValue extends Record<string, any>,
	TResult extends Record<string, any>,
> = TResult extends any[]
	? TResult extends (infer RItem)[]
		? RItem extends Record<string, any>
			? ResolveMethodExcludeValue<TValue, RItem>[]
			: ResolveMethodExcludeValue<TValue, TResult>[]
		: ResolveMethodExcludeValue<TValue, TResult>
	: ResolveMethodExcludeValue<TValue, TResult>;

export type MethodExcludeValue<TResult extends Record<string, any>> =
	MethodSelectValue<TResult>;
