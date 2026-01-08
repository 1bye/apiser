import type { DrizzleColumns, DrizzleRawOutput } from "@/types";
import type { Table } from "drizzle-orm";
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
  IsTable<TTable["table"]>
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
  DrizzleRawOutput<IsTable<TTable["table"]>>;

export type TableRelationsTableName<
  TTable extends TableRelationalConfig
> = {
  [K in keyof TTable["relations"]]:
  TTable["relations"][K]["targetTableName"]
}[keyof TTable["relations"]];

type TableOneRelationsMap<TTable extends TableRelationalConfig> = {
  [K in keyof TTable["relations"]as
  TTable["relations"][K]["relationType"] extends "many"
  ? never
  : K
  ]: TTable["relations"][K]["targetTableName"]
};

export type TableOneRelationsTableName<
  TTable extends TableRelationalConfig
> = TableOneRelationsMap<TTable>[keyof TableOneRelationsMap<TTable>];

export type IsTable<T> = T extends Table ? T : never;
