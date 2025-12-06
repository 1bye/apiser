import type { Column } from "drizzle-orm";
import type {
  DrizzleColumn,
  DrizzleColumns,
  DrizzleDataType,
  DrizzleTable,
} from "./types";
import { capitalize } from "./utils";

export type ColumnFunctions<TableColumn extends Column> = {
  // find: (by: DrizzleDataType<TableColumn["dataType"]>) => void;
  find: () => void;
  findOne: () => void;
  delete: () => ColumnFunctions<Column>;
};

export type ColumnOption<TableColumn extends Column> = DrizzleDataType<
  TableColumn["dataType"]
>;
export type ColumnOptionFn<TableColumn extends Column, T> = (
  option: ColumnOption<TableColumn>,
) => T;

export type ModelColumnFunctions<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
  ColumnKeys extends keyof Columns & string = keyof Columns & string,
> = {
  [ColumnKey in ColumnKeys]: ColumnOptionFn<
    Columns[ColumnKey],
    ColumnFunctions<Columns[ColumnKey]> &
      ModelColumnFunctions<Table, Columns, Exclude<ColumnKeys, ColumnKey>>
  >;
};
