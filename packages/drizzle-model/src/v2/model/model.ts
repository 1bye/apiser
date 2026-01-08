import type {
  TableRelationalConfig,
  TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { TableOutput } from "./table";
import type { MethodWithValue } from "./methods/with";
import type { MethodInsertValue } from "./methods/insert";
import type { ModelQueryResult, ModelMutateResult } from "./result";
import type { MethodUpdateValue } from "./methods/update";
import type { ModelDialect } from "./dialect";
import type { MethodWhereValue } from "./methods/query/where";
import type { ComposeModelOptions, ModelOptions, ResolveOptionsFormat, ResolveOptionsMethods } from "./options";
import type { ModelConfig } from "./config";
import type { Replace } from "../types";
import type { MethodUpsertValue } from "./methods/upsert";

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
  findMany(): ModelQueryResult<
    TableOutput<TTable>[],
    TConfig
  >;
  findFirst(): ModelQueryResult<
    TableOutput<TTable>,
    TConfig
  >,

  where(value: MethodWhereValue<TConfig["schema"], TConfig["table"]>): Model<TConfig>;

  insert<TValue extends MethodInsertValue<TTable>>(value: TValue): ModelMutateResult<void, TConfig, TValue extends any[] ? "many" : "one">;
  update<TValue extends MethodUpdateValue<TTable>>(value: TValue): ModelMutateResult<void, TConfig, "many">;
  delete(): ModelMutateResult<void, TConfig, "many">;

  upsert<TValue extends MethodUpsertValue<TConfig>>(value: TValue): ModelMutateResult<void, TConfig, TValue["insert"] extends any[] ? "many" : "one">;

  include<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
    value: TValue,
  ): TValue;
  // ): Compose<Model<TConfig>, MethodIncludeIdentifier<true>>;

  // db(db: any): Model<TConfig>;
}

export interface ModelQueryMethods<
  TConfig extends ModelConfig
> {
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
  };

export type ModelIdentifier<ModelName> = {
  $model: "model";
  $modelName: ModelName;
};
