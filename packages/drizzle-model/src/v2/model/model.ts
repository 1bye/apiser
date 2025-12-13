import type {
	DrizzleColumnTypeToType,
	DrizzleRawOutput,
	IsDrizzleTable,
} from "@/types";
import type {
	FindTargetTableInRelationalConfig,
	RelationsRecord,
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { TableColumn, TableColumns, TableOutput } from "./table";

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

// export type RelationTargetTableName<
// 	Key extends string,
// 	TRelations extends TableRelationalConfig,
// > = TRelations["relations"][Key]["targetTableName"];

export type WithTypeOutput<
	Key extends string,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = DrizzleRawOutput<
	IsDrizzleTable<TSchema[TTable["relations"][Key]["targetTableName"]]["table"]>
>;

export type TransformIntoRelationType<
	RelationType extends "many" | "one",
	T,
> = RelationType extends "many" ? T[] : T;

export type WithMethodResolvedResult<
	TValue extends Record<string, any>,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = {
	[Key in keyof TValue as TValue[Key] extends true | object
		? Key & string
		: never]: TValue[Key] extends Record<string, any>
		? TransformIntoRelationType<
				TTable["relations"][Key & string]["relationType"],
				WithMethodResolvedResult<
					TValue[Key],
					TSchema,
					TSchema[TTable["relations"][Key & string]["targetTableName"]]
				> &
					WithTypeOutput<Key & string, TSchema, TTable>
			>
		: TransformIntoRelationType<
				TTable["relations"][Key & string]["relationType"],
				WithTypeOutput<Key & string, TSchema, TTable>
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
		WithMethodResolvedResult<TValue, TSchema, TTable> & TResult,
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
