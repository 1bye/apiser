import type { UnwrapArray } from "@/types.ts";

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
	TResult extends Record<string, any>,
> = ResolveMethodSelectValue<TValue, TResult>;

export type MethodSelectValue<TResult> = TResult extends undefined
	? never
	: TResult extends readonly (infer U)[]
		? U extends object
			? MethodSelectValue<U>
			: never
		: TResult extends object
			? {
					[Key in keyof TResult]?: UnwrapArray<TResult[Key]> extends object
						? MethodSelectValue<UnwrapArray<TResult[Key]>> | boolean
						: boolean;
				}
			: never;
