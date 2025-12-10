import { and, SQL } from "drizzle-orm";
import type { ColumnFunctions, ColumnOption } from "../column";
import type {
  DrizzleColumn,
  DrizzleColumns,
  DrizzleInsertValues,
  DrizzleRawOutput,
  DrizzleTable,
} from "../types";
import { buildColumnCondition } from "../where";
import { ModelFunctionResult } from "../promise";
import type { BaseColumnFunctionOptions } from "./functions/base";
import type { FindOptions } from "./functions/find";
import type { FindOneOptions } from "./functions/find-one";
import type { InsertOptions } from "./functions/insert";

export type ModelQueryOptions<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table>,
> = {
  table: Table;
  columns: TableColumns;
  db: any;
  /** Filters */

  limitValue?: number;
  offsetValue?: number;

  conditions?: QueryConditions<Table>;
};

export type QueryConditions<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
> = Partial<Record<keyof TableColumns, ColumnOption<DrizzleColumn<Table>>>>;

export type QueryCondition<Table extends DrizzleTable> = ColumnOption<
  DrizzleColumn<Table>
>;

export class ModelQuery<
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
> {
  private table: Table;
  private columns: TableColumns;
  private conditions: QueryConditions<Table> = {};
  private db: any;

  private limitValue?: number;
  private offsetValue?: number;

  constructor({
    columns,
    table,
    limitValue,
    offsetValue,
    conditions,
    db,
  }: ModelQueryOptions<Table, TableColumns>) {
    this.table = table;
    this.columns = columns;
    this.db = db;

    this.limitValue = limitValue;
    this.offsetValue = offsetValue;
    this.conditions = conditions ?? {};

    const excludeKeys = Object.keys(this.conditions);
    const keys = Object.keys(columns).filter(
      (col) => !excludeKeys.includes(col),
    );

    keys.forEach((colName) => {
      Object.defineProperty(this, colName, {
        get: () => this.createColumnFunction(colName),
        enumerable: true,
      });
    });
  }

  private buildWhereExpression(): SQL<unknown> | undefined {
    const whereExpressions = Object.entries(this.conditions)
      .filter(([, option]) => option !== undefined)
      .map(([columnKey, option]) => {
        const column = this.columns[columnKey as keyof TableColumns] as any;
        return buildColumnCondition(
          column,
          option as ColumnOption<DrizzleColumn<Table>>,
        );
      })
      .filter((expr) => expr !== undefined);

    const where = whereExpressions.length
      ? and(...(whereExpressions as any))
      : undefined;

    return where;
  }

  private applyFilters(dbQuery: any, options?: BaseColumnFunctionOptions) {
    if (typeof options === "object") {
      if (typeof options.overrideLimit === "number") {
        dbQuery = dbQuery.limit(options.overrideLimit);
      }
    }

    if (
      typeof this.limitValue === "number" &&
      typeof options?.overrideLimit !== "number"
    ) {
      dbQuery = dbQuery.limit(this.limitValue);
    }

    if (typeof this.offsetValue === "number") {
      dbQuery = dbQuery.offset(this.offsetValue);
    }

    return dbQuery;
  }

  public async find(options?: FindOptions): Promise<DrizzleRawOutput<Table>[]> {
    const where = this.buildWhereExpression();

    let query = this.db.select().from(this.table);

    if (where) {
      query = query.where(where);
    }

    query = this.applyFilters(query, options);

    return (await query) as DrizzleRawOutput<Table>[];
  }

  public async findOne(
    options?: FindOneOptions,
  ): Promise<DrizzleRawOutput<Table> | null> {
    return await this.find({
      ...options,
      overrideLimit: 1,
    }).then((result) => result[0] ?? null);
  }

  public insert<
    Values extends DrizzleInsertValues<Table> = DrizzleInsertValues<Table>,
    Output extends DrizzleRawOutput<Table> = DrizzleRawOutput<Table>,
  >(
    values: Values,
    options?: InsertOptions,
  ): ModelFunctionResult<Values extends any[] ? Output[] : Output, void> {
    const where = this.buildWhereExpression();

    let query = this.db.insert(this.table).values(values);

    if (where) {
      query = query.where(where);
    }

    query = this.applyFilters(query, options);

    return new ModelFunctionResult<Values extends any[] ? Output[] : Output>(
      query,
    );
  }

  public limit(value: number) {
    this.limitValue = value;
    return this;
  }

  public offset(value: number) {
    this.offsetValue = value;
    return this;
  }

  private createColumnFunction<K extends keyof TableColumns>(col: K & string) {
    const self = this;

    // We need to declare result first so fn can reference it
    let result: any;

    const fn = (value: QueryCondition<Table>) => {
      self.conditions[col] = value;
      return result; // return the object with column getters, not just proxy
    };

    const methods: ColumnFunctions<Table, TableColumns[K]> = {
      find: async (options) => self.find(options),
      findOne: async (options) => self.findOne(options),
      insert: (values, options) => self.insert(values, options),
      limit: (value) => self.limit(value),
      offset: (value) => self.offset(value),
    };

    // Merge function and methods
    result = Object.assign(fn, methods);

    // Attach all column functions to the result so that nested calls like
    // userModel.id(5).name("Alex").find() are supported.
    Object.keys(self.columns).forEach((colName) => {
      Object.defineProperty(result, colName, {
        get: () =>
          self.createColumnFunction(colName as keyof TableColumns & string),
        enumerable: true,
      });
    });

    return result;
  }
}
