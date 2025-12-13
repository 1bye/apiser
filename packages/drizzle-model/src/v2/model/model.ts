import type { DrizzleColumnTypeToType } from "@/types";
import type {
	FindTargetTableInRelationalConfig,
	RelationsRecord,
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { TableColumn, TableColumns, TableOutput } from "./table";
import type { ResolveRelationSelection } from "./relation";

export type WithMethodValue<
	TSchema extends TablesRelationalConfig,
	TRelations extends RelationsRecord,
> = {
	[Key in keyof TRelations]?:
		| boolean
		| WithMethodValue<
				TSchema,
				FindTargetTableInRelationalConfig<TSchema, TRelations[Key]>["relations"]
		  >;
};

export interface ModelResult<
	TResult extends Record<string, any>,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> extends Promise<TResult> {
	with<TValue extends WithMethodValue<TSchema, TTable["relations"]>>(
		value: TValue,
	): ModelResult<
		ResolveRelationSelection<TValue, TSchema, TTable> & TResult,
		TSchema,
		TTable
	>;
}

export type ModelMethods<
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = {
	findMany: () => ModelResult<TableOutput<TTable>[], TSchema, TTable>;
	findFirst: () => ModelResult<TableOutput<TTable>, TSchema, TTable>;
};

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
	value: DrizzleColumnTypeToType<TableColumn<TColumnName, TTable>["dataType"]>,
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
> = {
	[ColumnKey in keyof TableColumns<TTable>]: ModelField<
		ColumnKey & string,
		TSchema,
		TTable
	>;
} & ModelMethods<TSchema, TTable>;
