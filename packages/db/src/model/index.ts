import {
  type Table as DrizzleTable,
  getTableName,
  getTableColumns,
} from "drizzle-orm";
import { type ModelColumnFunctions } from "./column";
import type { DrizzleColumns } from "./types";

export interface ModelOptions<Table extends DrizzleTable> {
  name: string;
  table: Table;
}

/*
 * Model
 */
export type IModel<Table extends DrizzleTable> = {
  table: Table;
  columns: DrizzleColumns<Table>;
} & ModelColumnFunctions<
  Table,
  DrizzleColumns<Table>,
  keyof DrizzleColumns<Table> & string
>;

export function model<Table extends DrizzleTable>(
  options: ModelOptions<Table>,
): IModel<Table> {
  const table = options.table;

  return new Model(table) as IModel<Table>;
}

export type ColumnQuery<T> = {
  find: () => void;
  update: (data: Partial<Record<string, any>>) => ColumnQuery<T>;
  delete: () => ColumnQuery<T>;
};

class Model<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table>,
> {
  private conditions: Partial<Record<keyof TableColumns, any>> = {};

  public table: Table;
  public columns: TableColumns;

  constructor(table: Table) {
    const columns = getTableColumns(table) as TableColumns;

    Object.keys(columns).forEach((colName) => {
      Object.defineProperty(this, colName, {
        get: () => this.createColumnFunction(colName),
        enumerable: true,
      });
    });

    this.table = table;
    this.columns = columns;
  }

  private createColumnFunction<K extends keyof TableColumns>(col: K) {
    const self = this;
    const fn = (value: TableColumns[K]["dataType"]) => {
      self.conditions[col] = value;
      return proxy;
    };

    const proxy: ColumnQuery<TableColumns[K]["dataType"]> = {
      find: () => {
        console.log("Finding with conditions:", self.conditions);
        return proxy;
      },
      update: (data) => {
        console.log(
          "Updating with conditions:",
          self.conditions,
          "data:",
          data,
        );
        return proxy;
      },
      delete: () => {
        console.log("Deleting with conditions:", self.conditions);
        return proxy;
      },
    };

    // Merge function and methods
    return Object.assign(fn, proxy);
  }
}
