import type {
  TableRelationalConfig,
  TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { MethodWithResult, MethodWithValue } from "./methods/with";
import type { MethodSelectResult, MethodSelectValue } from "./methods/select";
import type {
  MethodExcludeResult,
  MethodExcludeValue,
} from "./methods/exclude";
import type { MethodReturnResult } from "./methods/return";
import type { ReturningIdDialects } from "./dialect";
import type { TableOutput } from "./table";
import type { ModelConfig } from "./config";
import type { ResolveOptionsFormat } from "./options";
import type { ModelFormatValue } from "./format";

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
  TResult extends Record<string, any>,
  TConfig extends ModelConfig,
  TExcludedKeys extends string = string,
  TSchema extends TablesRelationalConfig = TConfig["schema"],
  TTable extends TableRelationalConfig = TConfig["table"],
  TFormat extends Record<string, any> | undefined = ResolveOptionsFormat<TConfig["options"]["format"]>
> extends Promise<ModelFormatValue<TResult, TFormat>> {
  with<TValue extends MethodWithValue<TSchema, TTable["relations"]>, TExcludeKeys extends string = TExcludedKeys | "with">(
    value: TValue,
  ): ModelQueryResult<
    MethodWithResult<TValue, TResult, TSchema, TTable>,
    TConfig,
    TExcludeKeys
  >,

  select<TValue extends MethodSelectValue<TResult>, TExcludeKeys extends string = TExcludedKeys | "select">(
    value: TValue,
  ): ModelQueryResult<
    MethodSelectResult<TValue, TResult>,
    TConfig,
    TExcludeKeys
  >,

  exclude<TValue extends MethodExcludeValue<TResult>, TExcludeKeys extends string = TExcludedKeys | "exclude">(
    value: TValue,
  ): ModelQueryResult<
    MethodExcludeResult<TValue, TResult>,
    TConfig,
    TExcludeKeys
  >,

  raw<TExcludeKeys extends string = TExcludedKeys | "raw">(): ModelQueryResult<TResult, TConfig, TExcludeKeys, TSchema, TTable, undefined>;

  debug(): any;
}

export interface ModelMutateResult<
  TBaseResult extends Record<string, any> | void,
  TConfig extends ModelConfig,
  TResultType extends string = "one"
> extends Promise<TBaseResult> {
  // TODO: Planned for future
  // with<TValue extends MethodWithInsertValue<TSchema, TTable["relations"]>>(
  //   value: TValue,
  // ): void;

  return<
    TValue extends MethodSelectValue<TableOutput<TConfig["table"]>> | undefined,
    TReturnResult extends MethodReturnResult<TResultType, TConfig> = MethodReturnResult<TResultType, TConfig>,
    TResult extends Record<string, any> = TValue extends undefined ? TReturnResult : MethodSelectResult<Exclude<TValue, undefined>, TReturnResult>,
  >(
    value?: TConfig["dialect"] extends ReturningIdDialects
      ? never
      : TValue,
  ): Omit<
    ModelMutateResult<
      TResult,
      TConfig,
      TResultType
    >,
    "with"
  >;
}
