import type {
  DrizzleColumns,
  DrizzleInsertModel,
  DrizzleRawOutput,
} from "./types";
import { type Table as DrizzleTable, getTableColumns } from "drizzle-orm";
import { type ModelColumnFunctions, type BaseColumnFunctions } from "./column";
import {
  type ModelQueryOptions,
  type QueryCondition,
  type QueryConditions,
  ModelQuery,
} from "./query";
import { ModelFunctionResult } from "./promise";

export interface ModelOptions<Table extends DrizzleTable> {
  table: Table;
  db: any;
}

export type ModelFunctions<Table extends DrizzleTable> = {
  limit: (limit: number) => IModel<Table>;
  offset: (offset: number) => IModel<Table>;
} & BaseColumnFunctions<Table>;

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

/*
 * Model
 */
class Model<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table>,
> {
  public table: Table;
  public columns: TableColumns;
  public db: any;

  constructor({ db, table }: ModelOptions<Table>) {
    const columns = getTableColumns(table) as TableColumns;

    Object.keys(columns).forEach((colName) => {
      Object.defineProperty(this, colName, {
        get: () => this.createColumnQuery(colName),
        enumerable: true,
      });
    });

    this.db = db;
    this.table = table;
    this.columns = columns;
  }

  private newQuery(
    options?: Omit<
      ModelQueryOptions<Table, TableColumns>,
      "table" | "columns" | "db"
    >,
  ) {
    return new ModelQuery({
      columns: this.columns,
      table: this.table,
      db: this.db,
      ...(options ?? {}),
    });
  }

  public limit(limit: number) {
    return this.newQuery({
      limitValue: limit,
    });
  }

  public offset(offset: number) {
    return this.newQuery({
      offsetValue: offset,
    });
  }

  public async find() {
    return (await this.db.select().from(this.table)) as any[];
  }

  public async findOne() {
    return (await this.db
      .select()
      .from(this.table)
      .limit(1)
      .then((result: any) => result[0])) as any;
  }

  public insert(values: DrizzleInsertModel<Table>) {
    const query = this.db.insert(this.table).values(values);

    return new ModelFunctionResult<DrizzleRawOutput<Table>>(query);
  }

  private createColumnQuery<K extends keyof TableColumns>(col: K & string) {
    return (value: QueryCondition<Table>) => {
      const conditions: QueryConditions<Table> = {};

      conditions[col] = value;

      return this.newQuery({
        conditions,
      });
    };
  }
}

export function model<Table extends DrizzleTable>(
  options: ModelOptions<Table>,
): IModel<Table> {
  return new Model(options) as unknown as IModel<Table>;
}
