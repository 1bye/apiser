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

  private limitValue?: number;
  private offsetValue?: number;

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
    let query = this.db.select().from(this.table);

    if (typeof this.limitValue === "number") {
      query = query.limit(this.limitValue);
    }

    if (typeof this.offsetValue === "number") {
      query = query.offset(this.offsetValue);
    }

    const resultRows = await query;

    this.conditions = {};
    this.limitValue = undefined;
    this.offsetValue = undefined;

    return resultRows as any;
  }

  public async findOne() {
    let query = this.db.select().from(this.table).limit(1);

    if (typeof this.offsetValue === "number") {
      query = query.offset(this.offsetValue);
    }

    const rows = await query;

    this.conditions = {};
    this.limitValue = undefined;
    this.offsetValue = undefined;

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

        let query = self.db.select().from(self.table);

        if (where) {
          query = query.where(where);
        }

        if (typeof self.limitValue === "number") {
          query = query.limit(self.limitValue);
        }

        if (typeof self.offsetValue === "number") {
          query = query.offset(self.offsetValue);
        }

        const resultRows = await query;

        self.conditions = {};
        self.limitValue = undefined;
        self.offsetValue = undefined;
        return resultRows as any;
      },
      findOne: async () => {
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

        let query = self.db.select().from(self.table).limit(1);

        if (where) {
          query = query.where(where);
        }

        if (typeof self.offsetValue === "number") {
          query = query.offset(self.offsetValue);
        }

        const rows = await query;

        self.conditions = {};
        self.limitValue = undefined;
        self.offsetValue = undefined;
        return (rows as any[])[0];
      },
      limit: (value: number) => {
        self.limitValue = value;
        return result;
      },
      offset: (value: number) => {
        self.offsetValue = value;
        return result;
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
