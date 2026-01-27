import type {
  TableRelationalConfig,
  TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { MethodWithValue } from "./methods/with.ts";
import type { MethodInsertValue } from "./methods/insert.ts";
import type { ModelQueryResult, ModelMutateResult } from "./result.ts";
import type { MethodUpdateValue } from "./methods/update.ts";
import type { ModelDialect } from "./dialect.ts";
import type { MethodWhereValue } from "./methods/query/where.ts";
import type { ComposeModelOptions, ModelOptions, ResolveOptionsFormat, ResolveOptionsMethods } from "./options.ts";
import type { ModelConfig } from "./config.ts";
import type { Replace } from "../types.ts";
import type { MethodUpsertValue } from "./methods/upsert.ts";

/**
 * Interface defining standard query methods available on a model.
 *
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the current table
 */
export interface ModelMethods<
  TConfig extends ModelConfig,
  TSchema extends TablesRelationalConfig = TConfig["schema"],
  TTable extends TableRelationalConfig = TConfig["table"],
  TDialect extends ModelDialect = TConfig["dialect"]
> {
  /**
   * Fetches all rows for the current model query.
   */
  findMany(): ModelQueryResult<
    TConfig["tableOutput"][],
    TConfig
  >;
  /**
   * Fetches the first matching row for the current model query.
   */
  findFirst(): ModelQueryResult<
    TConfig["tableOutput"],
    TConfig
  >,

  /**
   * Adds a where clause to the current model query.
   *
   * @param value - Where conditions for the model query
   */
  where(value: MethodWhereValue<TConfig["schema"], TConfig["table"]>): Model<TConfig>;

  /**
   * Inserts one or many rows into the model table.
   *
   * @param value - Insert payload or batch payload
   */
  insert<TValue extends MethodInsertValue<TTable>>(value: TValue): ModelMutateResult<void, TConfig, TValue extends any[] ? "many" : "one">;
  /**
   * Updates rows that match the current model query.
   *
   * @param value - Update payload
   */
  update<TValue extends MethodUpdateValue<TTable>>(value: TValue): ModelMutateResult<void, TConfig, "many">;
  /**
   * Deletes rows that match the current model query.
   */
  delete(): ModelMutateResult<void, TConfig, "many">;

  /**
   * Inserts or updates rows based on conflict criteria.
   *
   * @param value - Upsert payload or batch payload
   */
  upsert<TValue extends MethodUpsertValue<TConfig>>(value: TValue): ModelMutateResult<void, TConfig, TValue["insert"] extends any[] ? "many" : "one">;

  /**
   * Includes related entities in the current model query.
   *
   * @param value - Include configuration for relations
   */
  include<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
    value: TValue,
  ): TValue;
}

export interface ModelQueryMethods<
  TConfig extends ModelConfig
> {
  /**
   * Extends the current model with additional options.
   *
   * @param config - Options to merge into the model
   */
  extend<
    TOptions extends ModelOptions<TConfig["schema"], TConfig["table"], TConfig["dialect"]>
  >(config: TOptions): Model<
    Replace<
      TConfig,
      {
        options: ComposeModelOptions<
          TOptions,
          TConfig["options"]
        >;
      }
    >
  >;

  /**
   * Binds a database client to the model.
   *
   * @param db - Database client instance
   */
  db(db: any): Model<TConfig>;
}

/**
 * Just base represenation of model. This type JUST made for more clearer types, not more...
 */
export type ModelBase<
  TConfig extends ModelConfig
> = ModelMethods<TConfig>
  & ModelQueryMethods<TConfig>;

/**
 * Main model interface for a table.
 *
 * Each column of the table is exposed as a strongly-typed field setter,
 * allowing type-safe assignment of values when building or mutating models.
 *
 * This type is intended to be extended with query helpers and other
 * model-level utilities.
 *
 * @typeParam TConfig - Config that includes all related information about tables, relations and etc...
 */
export type Model<
  TConfig extends ModelConfig,
> = ModelIdentifier<TConfig["table"]["name"]>
  & ModelBase<TConfig>
  & ResolveOptionsMethods<TConfig["options"]["methods"]>
  & {
    $format: TConfig["options"]["format"];
    $formatValue: ResolveOptionsFormat<TConfig["options"]["format"]>;

    $$config: TConfig;
  };

export type ModelIdentifier<ModelName> = {
  $model: "model";
  $modelName: ModelName;
};
