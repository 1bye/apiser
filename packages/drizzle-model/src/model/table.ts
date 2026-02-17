import type { InferInsertModel, InferSelectModel, Table } from "drizzle-orm";
import type { SchemaEntry, TableRelationalConfig } from "drizzle-orm/relations";

/**
 * Extracts the column definitions from a Drizzle table configuration.
 *
 * This utility resolves the actual Drizzle table type and maps it
 * to its available column metadata.
 *
 * @typeParam TTable - Relational configuration for the table
 */
/**
 * Returns the column map from the underlying Drizzle table definition.
 *
 * @typeParam TTable - Relational configuration for the table
 */
export type TableColumns<TTable extends TableRelationalConfig> = IsTable<
	TTable["table"]
>["_"]["columns"];

/**
 * Resolves a single column definition from a table by column name.
 *
 * @typeParam TColumnName - Name of the column to extract
 * @typeParam TTable - Relational configuration for the table
 */
/**
 * Selects a single column definition by name.
 *
 * @typeParam TColumnName - Name of the column to extract
 * @typeParam TTable - Relational configuration for the table
 */
export type TableColumn<
	TColumnName extends string,
	TTable extends TableRelationalConfig,
> = TableColumns<TTable>[TColumnName];

/**
 * Resolves the inferred select model for a table-like input.
 *
 * @typeParam TTable - Relation config, schema entry, or table
 */
export type TableOutput<
	TTable extends TableRelationalConfig | SchemaEntry | Table,
> =
	NormalizeTable<TTable> extends Table
		? InferSelectModel<NormalizeTable<TTable>>
		: never;
// Is relation?
// (TTable extends TableRelationalConfig
//   ? InferSelectModel<IsTable<TTable["table"]>>
//   : (TTable extends SchemaEntry
//     // Is schema entry (view/table)?
//     ? InferSelectModel<IsTable<TTable>>
//     : (TTable extends Table
//       // Is Table?
//       ? InferSelectModel<TTable>
//       : never)));

/**
 * Normalizes relation config and schema entries into a Drizzle table type.
 *
 * @typeParam TTable - Relation config, schema entry, or table
 */
export type NormalizeTable<
	TTable extends TableRelationalConfig | SchemaEntry | Table,
> =
	// Is relation?
	TTable extends TableRelationalConfig
		? IsTable<TTable["table"]>
		: TTable extends SchemaEntry
			? // Is schema entry (view/table)?
				IsTable<TTable>
			: TTable extends Table
				? // Is Table?
					TTable
				: never;

/**
 * Collects target table names from all relations.
 *
 * @typeParam TTable - Relational configuration for the table
 */
export type TableRelationsTableName<TTable extends TableRelationalConfig> = {
	[K in keyof TTable["relations"]]: TTable["relations"][K]["targetTableName"];
}[keyof TTable["relations"]];

/**
 * Maps non-"many" relations to their target table names.
 *
 * @typeParam TTable - Relational configuration for the table
 */
type TableOneRelationsMap<TTable extends TableRelationalConfig> = {
	[K in keyof TTable["relations"] as TTable["relations"][K]["relationType"] extends "many"
		? never
		: K]: TTable["relations"][K]["targetTableName"];
};

/**
 * Collects target table names for non-"many" relations.
 *
 * @typeParam TTable - Relational configuration for the table
 */
export type TableOneRelationsTableName<TTable extends TableRelationalConfig> =
	TableOneRelationsMap<TTable>[keyof TableOneRelationsMap<TTable>];

/**
 * Narrows a type to a Drizzle table when possible.
 *
 * @typeParam T - Candidate table type
 */
export type IsTable<T> = T extends Table ? T : never;

/**
 * Infers insert model for a Drizzle table.
 *
 * @typeParam TTable - Drizzle table type
 */
export type TableInsertModel<TTable extends Table> = InferInsertModel<TTable>;

/**
 * Accepts a single insert payload or a batch of insert payloads.
 *
 * @typeParam TTable - Drizzle table type
 */
export type TableInsertValues<TTable extends Table> =
	| InferInsertModel<TTable>
	| InferInsertModel<TTable>[];
