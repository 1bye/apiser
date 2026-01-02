import type {
  TableRelationalConfig,
  TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { TableColumn, TableColumns, TableOutput } from "./table";
import type { ColumnValue } from "./operations";
import type { MethodWithValue } from "./methods/with";
import type { MethodInsertValue } from "./methods/insert";
import type { ModelQueryResult, ModelMutateResult } from "./result";
import type { MethodUpdateValue } from "./methods/update";
import type { ModelDialect } from "./dialect";
import type { ModelForegins } from "./foreigns";
import type { ModelFirstLevelMethods } from "./methods/levels";
import type { MethodWhereValue } from "./methods/query/where";
import type { Compose } from "../types";
import type { MethodIncludeIdentifier } from "./methods/include";
import type { ModelOptions } from "./options";
import type { ModelConfig } from "./config";

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
  findMany(): ModelQueryResult<TableOutput<TTable>[], TSchema, TTable>;
  findFirst(): ModelQueryResult<TableOutput<TTable>, TSchema, TTable>;

  insert<TValue extends MethodInsertValue<TTable>>(value: TValue): ModelMutateResult<void, TValue, TSchema, TTable, TDialect, "one">;
  update<TValue extends MethodUpdateValue<TTable>>(value: TValue): ModelMutateResult<void, TValue, TSchema, TTable, TDialect, "many">;
  delete(): ModelMutateResult<void, {}, TSchema, TTable, TDialect, "many">;

  include<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
    value: TValue,
  ): TValue;
  // ): Compose<Model<TConfig>, MethodIncludeIdentifier<true>>;

  db(db: any): Model<TConfig>;
}

export interface ModelQueryMethods<
  TConfig extends ModelConfig
> {
  where(value: MethodWhereValue<TConfig["schema"], TConfig["table"]>): Model<TConfig>;

  db(db: any): Model<TConfig>;
}

/**
 * Represents a strongly-typed setter function for a single model field.
 *
 * The field type is derived from the underlying Drizzle column's `dataType`,
 * ensuring that only valid values for that column can be assigned.
 *
 * @typeParam TColumnName - Name of the column in the table
 * @typeParam TSchema - Full relational schema containing all tables
 * @typeParam TTable - Relational configuration for the current table
 */
// export type ModelField<
//   TColumnName extends string,
//   TSchema extends TablesRelationalConfig,
//   TTable extends TableRelationalConfig,
//   TDialect extends ModelDialect,
// > = (
//   value: ColumnValue<TableColumn<TColumnName, TTable>>,
// ) => Omit<Model<TSchema, TTable, TDialect>, TColumnName | ModelFirstLevelMethods>;


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
 * @typeParam TSchema - Full relational schema containing all tables
 * @typeParam TTable - Relational configuration for the current table
 */
export type Model<
  TConfig extends ModelConfig,
> = ModelIdentifier<TConfig["table"]["name"]> & ModelBase<TConfig> & TConfig["options"]["methods"];

export type ModelIdentifier<ModelName> = {
  $model: "model";
  $modelName: ModelName;
};
