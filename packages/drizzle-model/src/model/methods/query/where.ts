import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { SQL } from "drizzle-orm/sql";
import type { ColumnValue } from "../../query/operations.ts";
import type { TableColumn, TableColumns } from "../../table.ts";
import type { MethodIncludeIdentifier } from "../include.ts";

export type MethodWhereValue<
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
	TValue =
		| SQL
		| MethodWhereColumns<TTable>
		| MethodIncludeIdentifier<any>,
> =
	// Is result of .include fn?
	TValue extends MethodIncludeIdentifier<true>
		? never
		: // Is SQL?
			TValue extends SQL
			? TValue
			: // Is columns where clauses?
				TValue extends MethodWhereColumns<TTable>
				? TValue
				: never;

export type MethodWhereColumns<TTable extends TableRelationalConfig> = {
	[ColumnName in keyof TableColumns<TTable>]?: ColumnValue<
		TableColumn<ColumnName & string, TTable>
	>;
};
