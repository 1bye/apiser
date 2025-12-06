import {
  type Table as DrizzleTable,
  getTableName,
  getTableColumns,
} from "drizzle-orm";
import { capitalize } from "./utils";
import { createColumnFunctions, type ModelColumnFunctions } from "./column";
import type { DrizzleColumns } from "./types";

export interface ModelOptions<Table extends DrizzleTable> {
  name: string;
  table: Table;
}

/*
 * Model
 */
export type Model<Table extends DrizzleTable> = {
  table: Table;
} & ModelColumnFunctions<
  Table,
  DrizzleColumns<Table>,
  keyof DrizzleColumns<Table> & string
>;

export function model<Table extends DrizzleTable>(
  options: ModelOptions<Table>,
): Model<Table> {
  const table = options.table;
  const columns = getTableColumns(table);
  // const tableName = options.table._.name;

  console.log({
    name: getTableName(table),
    columns,
  });

  const columnFunctions = createColumnFunctions<Table>(columns);

  // console.dir(options.table, {
  //   depth: 5,
  // });

  return {
    table: table,
    ...columnFunctions,
  };
}

// TEST
