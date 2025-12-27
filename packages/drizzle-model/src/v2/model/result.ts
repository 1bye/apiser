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
import type { MethodWithInsertValue } from "./methods/insert";

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
export interface ModelResult<
  TResult extends Record<string, any>,
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
> extends Promise<TResult> {
  with<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
    value: TValue,
  ): ModelResult<
    MethodWithResult<TValue, TResult, TSchema, TTable>,
    TSchema,
    TTable
  >;

  select<TValue extends MethodSelectValue<TResult>>(
    value: TValue,
  ): ModelResult<MethodSelectResult<TValue, TResult>, TSchema, TTable>;

  exclude<TValue extends MethodExcludeValue<TResult>>(
    value: TValue,
  ): ModelResult<MethodExcludeResult<TValue, TResult>, TSchema, TTable>;
}

export interface ModelInsertResult<
  TResult extends Record<string, any> | void,
  TPayload extends Record<string, any> | any[],
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
> extends Promise<TResult> {
  // TODO: Planned for future
  // with<TValue extends MethodWithInsertValue<TSchema, TTable["relations"]>>(
  //   value: TValue,
  // ): void;

  return(): Omit<
    ModelInsertResult<
      MethodReturnResult<TPayload, TTable>,
      TPayload,
      TSchema,
      TTable
    >,
    "with"
  >;
}
