import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { TableColumn, TableColumns, TableOutput } from "./table";
import type { ColumnValue } from "./operations";
import type { MethodWithResult, MethodWithValue } from "./methods/with";
import type { MethodSelectResult, MethodSelectValue } from "./methods/select";
import type {
	MethodExcludeResult,
	MethodExcludeValue,
} from "./methods/exclude";

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

/**
 * Interface defining standard query methods available on a model.
 *
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the current table
 */
export interface ModelMethods<
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> {
	findMany(): ModelResult<TableOutput<TTable>[], TSchema, TTable>;
	findFirst(): ModelResult<TableOutput<TTable>, TSchema, TTable>;

	insert(): void;

	with<TValue extends MethodWithValue<TSchema, TTable["relations"]>>(
		value: TValue,
	): TValue;
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
export type ModelField<
	TColumnName extends string,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = (
	value: ColumnValue<TableColumn<TColumnName, TTable>>,
) => Omit<Model<TSchema, TTable>, TColumnName>;

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
> = ModelIdentifier & {
	[ColumnKey in keyof TableColumns<TTable>]: ModelField<
		ColumnKey & string,
		TSchema,
		TTable
	>;
} & ModelMethods<TSchema, TTable>;

export type ModelIdentifier = {
	$model: "model";
};
