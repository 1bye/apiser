import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { SimplifyDeep } from "type-fest";
import type {
	ApplyArrayIfArray,
	InferArrayItem,
	MergeExclusive,
	Simplify,
} from "@/types.ts";
import type { ModelConfig } from "./config.ts";
import type { ReturningIdDialects } from "./dialect.ts";
import type { ModelFormatResult } from "./format.ts";
import type {
	MethodExcludeResult,
	MethodExcludeValue,
} from "./methods/exclude.ts";
import type { MethodReturnResult } from "./methods/return.ts";
import type {
	MethodSelectResult,
	MethodSelectValue,
} from "./methods/select.ts";
import type { MethodWithResult, MethodWithValue } from "./methods/with.ts";
import type { ResolveOptionsFormat } from "./options.ts";
import type { QueryError } from "./query/error.ts";

/**
 * Represents the result of a model operation (like findMany or findFirst).
 *
 * It extends Promise to be awaitable, returning the result data.
 * It also exposes a `.with()` method for chaining relation loading.
 *
 * @typeParam TResult - The type of the data returned (e.g. Row[])
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the current table
 */
export interface ModelQueryResult<
	TResult extends Record<string, any> | any[] | undefined,
	TConfig extends ModelConfig,
	TExcludedKeys extends string = string,
	TSchema extends TablesRelationalConfig = TConfig["schema"],
	TTable extends TableRelationalConfig = TConfig["table"],
	TFormat extends Record<string, any> | undefined = ResolveOptionsFormat<
		TConfig["options"]["format"]
	>,
	TWithSafe extends true | false = false,
> extends Promise<
		ApplySafeResultIf<
			TWithSafe,
			ApplyArrayIfArray<
				TResult,
				SimplifyDeep<
					ModelFormatResult<InferArrayItem<TResult>, TFormat, TTable>
				>
			>
		>
	> {
	$format: TFormat;
	debug(): any;

	exclude<
		TValue extends MethodExcludeValue<Exclude<TResult, undefined>>,
		TExcludeKeys extends string = TExcludedKeys | "exclude",
	>(
		value: TValue
	): ModelQueryResult<
		ApplyArrayIfArray<
			TResult,
			MethodExcludeResult<TValue, InferArrayItem<Exclude<TResult, undefined>>>
		>,
		TConfig,
		TExcludeKeys,
		TSchema,
		TTable,
		TFormat,
		TWithSafe
	>;

	raw<TExcludeKeys extends string = TExcludedKeys | "raw">(): ModelQueryResult<
		TResult,
		TConfig,
		TExcludeKeys,
		TSchema,
		TTable,
		undefined,
		TWithSafe
	>;

	safe(): ModelQueryResult<
		TResult,
		TConfig,
		TExcludedKeys | "safe",
		TSchema,
		TTable,
		TFormat,
		true
	>;

	select<
		TValue extends MethodSelectValue<Exclude<TResult, undefined>>,
		TExcludeKeys extends string = TExcludedKeys | "select",
	>(
		value: TValue
	): ModelQueryResult<
		ApplyArrayIfArray<
			TResult,
			MethodSelectResult<TValue, InferArrayItem<Exclude<TResult, undefined>>>
		>,
		TConfig,
		TExcludeKeys,
		TSchema,
		TTable,
		TFormat,
		TWithSafe
	>;

	with<
		TValue extends MethodWithValue<TSchema, TTable["relations"]>,
		TExcludeKeys extends string = TExcludedKeys | "with",
	>(
		value: TValue
	): ModelQueryResult<
		MethodWithResult<TValue, TResult, TSchema, TTable>,
		TConfig,
		TExcludeKeys,
		TSchema,
		TTable,
		TFormat,
		TWithSafe
	>;
}

export interface ModelInMutableResult<
	TBaseResult extends Record<string, any> | any[] | never,
	TConfig extends ModelConfig,
> extends Promise<Simplify<TBaseResult>> {
	// TODO: Planned for future
	// with<TValue extends MethodWithInsertValue<TSchema, TTable["relations"]>>(
	//   value: TValue,
	// ): void;
	// return<
	// 	TValue extends MethodSelectValue<TableOutput<TConfig["table"]>> | undefined,
	// 	TReturnResult extends MethodReturnResult<
	// 		TResultType,
	// 		TConfig
	// 	> = MethodReturnResult<TResultType, TConfig>,
	// 	TResult extends Record<string, any> = TValue extends undefined
	// 		? TReturnResult
	// 		: MethodSelectResult<Exclude<TValue, undefined>, TReturnResult>,
	// >(
	// 	value?: TConfig["dialect"] extends ReturningIdDialects ? never : TValue
	// ): Omit<ModelMutateResult<TResult, TConfig, TResultType>, "with">;
	// $return: MethodReturnResult<TConfig>;

	omit<
		TValue extends MethodExcludeValue<
			Exclude<TConfig["tableOutput"], undefined>
		>,
	>(
		value: TValue
	): ModelInMutableResult<
		ApplyArrayIfArray<
			TConfig["tableOutput"],
			MethodExcludeResult<
				TValue,
				InferArrayItem<Exclude<TConfig["tableOutput"], undefined>>
			>
		>,
		TConfig
	>;
	return<
		TValue extends MethodSelectValue<TConfig["tableOutput"]> | undefined,
		TReturnResult extends
			MethodReturnResult<TConfig> = MethodReturnResult<TConfig>,
		TResult extends Record<string, any> = undefined extends TValue
			? TReturnResult
			: MethodSelectResult<Exclude<TValue, undefined>, TReturnResult>,
	>(
		value?: TConfig["dialect"] extends ReturningIdDialects ? never : TValue
	): ModelMutateResult<Simplify<TResult>[], TConfig>;

	returnFirst<
		TValue extends MethodSelectValue<TConfig["tableOutput"]> | undefined,
		TReturnResult extends
			MethodReturnResult<TConfig> = MethodReturnResult<TConfig>,
		TResult extends Record<string, any> = undefined extends TValue
			? TReturnResult
			: MethodSelectResult<Exclude<TValue, undefined>, TReturnResult>,
	>(
		value?: TConfig["dialect"] extends ReturningIdDialects ? never : TValue
	): ModelMutateResult<Simplify<TResult>, TConfig>;
}

export interface ModelMutateResult<
	TResult extends Record<string, any> | any[] | never,
	TConfig extends ModelConfig,
	TExcludedKeys extends string = string,
	TWithSafe extends true | false = false,
> extends Promise<ApplySafeResultIf<TWithSafe, TResult>> {
	omit<
		TValue extends MethodExcludeValue<Exclude<TResult, undefined>>,
		TExcludeKeys extends string = TExcludedKeys | "omit",
	>(
		value: TValue
	): ModelMutateResult<
		ApplyArrayIfArray<
			TResult,
			Simplify<
				MethodExcludeResult<TValue, InferArrayItem<Exclude<TResult, undefined>>>
			>
		>,
		TConfig,
		TExcludeKeys
	>;

	safe(): ModelMutateResult<TResult, TConfig, TExcludedKeys, true>;
}

export type SafeResult<TResult> = MergeExclusive<
	{
		error: QueryError;
	},
	{
		data: TResult;
	}
>;

export type ApplySafeResultIf<
	TCondition extends true | false,
	TResult,
> = TCondition extends true ? SafeResult<TResult> : TResult;
