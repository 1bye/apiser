import {
  type Table as DrizzleTable,
  getTableName,
  getTableColumns,
} from "drizzle-orm";
import {
  type ColumnFunctions,
  type ColumnOption,
  type ModelColumnFunctions,
} from "./column";
import type { DrizzleColumn, DrizzleColumns } from "./types";

export interface ModelOptions<Table extends DrizzleTable> {
  table: Table;
}

/*
 * Model
 */
export type IModel<Table extends DrizzleTable> = {
  table: Table;
  columns: DrizzleColumns<Table>;
  db: any;
} & ModelColumnFunctions<
  Table,
  DrizzleColumns<Table>,
  keyof DrizzleColumns<Table> & string
>;

export function model<Table extends DrizzleTable>(
  options: ModelOptions<Table>,
): IModel<Table> {
  const table = options.table;

  return new Model(table, options.db) as IModel<Table>;
}

class Model<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table>,
> {
  private conditions: Partial<
    Record<keyof TableColumns, ColumnOption<DrizzleColumn<Table>>>
  > = {};

  public table: Table;
  public columns: TableColumns;
  public db: any;

  constructor(table: Table, db: any) {
    const columns = getTableColumns(table) as TableColumns;

    Object.keys(columns).forEach((colName) => {
      Object.defineProperty(this, colName, {
        get: () => this.createColumnFunction(colName),
        enumerable: true,
      });
    });

    this.db = db;
    this.table = table;
    this.columns = columns;
  }

  private createColumnFunction<K extends keyof TableColumns>(col: K) {
    const self = this;

    // We need to declare result first so fn can reference it
    let result: any;

    const fn = (value: any) => {
      self.conditions[col] = value;
      return result; // return the object with column getters, not just proxy
    };

    const methods: ColumnFunctions<Table, TableColumns[K]> = {
      find: () => {
        console.log("Finding with conditions:", self.conditions);
        return result;
      },
      findOne: () => {},
    };

    // Merge function and methods
    result = Object.assign(fn, methods);

    // Attach all column functions to the result so that nested calls like
    // userModel.id(5).name("Alex").find() are supported.
    Object.keys(self.columns).forEach((colName) => {
      Object.defineProperty(result, colName, {
        get: () => self.createColumnFunction(colName as keyof TableColumns),
        enumerable: true,
      });
    });

    return result;
  }
}
