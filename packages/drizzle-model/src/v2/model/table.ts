import type { DrizzleColumns, DrizzleRawOutput, IsDrizzleTable } from "@/types";
import type { TableRelationalConfig } from "drizzle-orm/relations";

/**
 * Extracts the column definitions from a Drizzle table configuration.
 *
 * This utility resolves the actual Drizzle table type and maps it
 * to its available column metadata.
 *
 * @typeParam TTable - Relational configuration for the table
 */
export type TableColumns<TTable extends TableRelationalConfig> = DrizzleColumns<
	IsDrizzleTable<TTable["table"]>
>;

/**
 * Resolves a single column definition from a table by column name.
 *
 * @typeParam TColumnName - Name of the column to extract
 * @typeParam TTable - Relational configuration for the table
 */
export type TableColumn<
	TColumnName extends string,
	TTable extends TableRelationalConfig,
> = TableColumns<TTable>[TColumnName];

export type TableOutput<TTable extends TableRelationalConfig> =
	DrizzleRawOutput<IsDrizzleTable<TTable["table"]>>;
