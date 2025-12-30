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

/**
 * Interface defining standard query methods available on a model.
 *
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the current table
 */
export interface ModelMethods<
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
  TDialect extends ModelDialect
> {
  $findMany(): ModelQueryResult<TableOutput<TTable>[], TSchema, TTable>;
  $findFirst(): ModelQueryResult<TableOutput<TTable>, TSchema, TTable>;

  $insert<TValue extends MethodInsertValue<TTable>>(value: TValue): ModelMutateResult<void, TValue, TSchema, TTable, TDialect, "one">;
  $update<TValue extends MethodUpdateValue<TTable>>(value: TValue): ModelMutateResult<void, TValue, TSchema, TTable, TDialect, "many">;
  $delete(): ModelMutateResult<void, {}, TSchema, TTable, TDialect, "many">;

  $with<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
    value: TValue,
  ): TValue;
}

export type ModelFirstLevelMethods = "insert";

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
export type ModelField<
  TColumnName extends string,
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
  TDialect extends ModelDialect
> = (
  value: ColumnValue<TableColumn<TColumnName, TTable>>,
) => Omit<Model<TSchema, TTable, TDialect>, TColumnName | ModelFirstLevelMethods>;

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
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
  TDialect extends ModelDialect
> = ModelIdentifier & {
  [ColumnKey in keyof TableColumns<TTable>]: ModelField<
    ColumnKey & string,
    TSchema,
    TTable,
    TDialect
  >;
} & ModelMethods<TSchema, TTable, TDialect>;

export type ModelIdentifier = {
  $model: "model";
};
