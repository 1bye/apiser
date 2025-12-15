import type { UnwrapArray } from "@/types";

export type ResolveMethodSelectValue<
	TValue extends Record<string, any>,
	TResult extends Record<string, any>,
> = {
	[Key in keyof TValue]: TValue[Key] extends object
		? TResult[Key & string] extends (infer RItem)[]
			? RItem extends Record<string, any>
				? ResolveMethodSelectValue<TValue[Key], RItem>[]
				: never
			: TResult[Key & string] extends Record<string, any>
				? ResolveMethodSelectValue<TValue[Key], TResult[Key & string]>
				: never
		: TResult[Key & string];
};

export type MethodSelectResult<
	TValue extends Record<string, any>,
	TResult extends Record<string, any> | any[],
> = TResult extends any[]
	? TResult extends (infer RItem)[]
		? RItem extends Record<string, any>
			? ResolveMethodSelectValue<TValue, RItem>[]
			: ResolveMethodSelectValue<TValue, TResult>[]
		: ResolveMethodSelectValue<TValue, TResult>
	: ResolveMethodSelectValue<TValue, TResult>;

export type MethodSelectValue<TResult extends object> =
	TResult extends readonly (infer U)[]
		? U extends object
			? MethodSelectValue<U>
			: never
		: {
				[Key in keyof TResult]?: UnwrapArray<TResult[Key]> extends object
					? MethodSelectValue<UnwrapArray<TResult[Key]>> | boolean
					: boolean;
			};
