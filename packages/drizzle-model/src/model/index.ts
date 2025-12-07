import {
  type Table as DrizzleTable,
  getTableName,
  getTableColumns,
  and,
} from "drizzle-orm";
import {
  type ColumnFunctions,
  type ColumnOption,
  type ModelColumnFunctions,
} from "./column";
import type { DrizzleColumn, DrizzleColumns, DrizzleRawOutput } from "./types";
import { buildColumnCondition } from "./where";

export interface ModelOptions<Table extends DrizzleTable> {
  table: Table;
  db: any;
}

export interface ModelFunctions<Table extends DrizzleTable> {
  find: () => Promise<DrizzleRawOutput<Table>[]>;
  findOne: () => Promise<DrizzleRawOutput<Table>>;
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
> &
  ModelFunctions<Table>;

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

  public async find() {
    const query = this.db.select().from(this.table);

    const resultRows = await query;

    this.conditions = {};

    return resultRows as any;
  }

  public async findOne() {
    const rows = await this.find();
    return (rows as any[])[0];
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
      find: async () => {
        const whereExpressions = Object.entries(self.conditions)
          .filter(([, option]) => option !== undefined)
          .map(([columnKey, option]) => {
            const column = self.columns[columnKey as keyof TableColumns] as any;
            return buildColumnCondition(
              column,
              option as ColumnOption<DrizzleColumn<Table>>,
            );
          })
          .filter((expr) => expr !== undefined);

        const where = whereExpressions.length
          ? and(...(whereExpressions as any))
          : undefined;

        const query = where
          ? self.db.select().from(self.table).where(where)
          : self.db.select().from(self.table);

        const resultRows = await query;

        self.conditions = {};

        return resultRows as any;
      },
      findOne: async () => {
        const rows = await methods.find();
        return (rows as any[])[0];
      },
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
