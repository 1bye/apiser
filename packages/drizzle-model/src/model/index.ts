import type {
  DrizzleColumns,
  DrizzleInsertValues,
  DrizzleRawOutput,
} from "../types";
import {
  type Table as DrizzleTable,
  type ExtractTablesWithRelations,
  getTableColumns,
  type RelationsBuilderConfig,
  type Schema,
} from "drizzle-orm";
import {
  type ModelQueryOptions,
  type QueryCondition,
  type QueryConditions,
  ModelQuery,
} from "../query";
import { ModelFunctionResult } from "@/promise";
import type { InsertOptions } from "@/query/functions/insert";
import type {
  ModelBuilderOptions,
  ModelBulilderModelOptions,
  ModelFunctions,
  ModelOptions,
  ExtractTablesFromSchema,
  IModel,
} from "./types";

/*
 * Model
 */
class Model<
  Tables extends Schema,
  Table extends DrizzleTable,
  TableColumns extends DrizzleColumns<Table>,
> implements ModelFunctions<Tables, Table> {
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

  public insert<
    Values extends DrizzleInsertValues<Table> = DrizzleInsertValues<Table>,
    Output extends DrizzleRawOutput<Table> = DrizzleRawOutput<Table>,
  >(
    values: Values,
    options?: InsertOptions,
  ): ModelFunctionResult<Values extends any[] ? Output[] : Output, void> {
    const query = this.db.insert(this.table).values(values);

    return new ModelFunctionResult<
      Values extends any[] ? Output[] : Output,
      void
    >(query);
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

// export function model<Table extends DrizzleTable>(
//   options: ModelOptions<Table>,
// ): IModel<Table> {
//   return new Model(options) as unknown as IModel<Table>;
// }

export function modelBuilder<
  TDb extends any,
  TRelations extends ExtractTablesWithRelations<TConfig, TTables>,
  TSchema extends Record<string, DrizzleTable> = Record<string, DrizzleTable>,
  TTables extends ExtractTablesFromSchema<TSchema> =
    ExtractTablesFromSchema<TSchema>,
  TConfig extends RelationsBuilderConfig<TTables> =
    RelationsBuilderConfig<TTables>,
>(builderOptions: ModelBuilderOptions<TDb, TRelations, TSchema>) {
  return <
    TTableName extends DrizzleTable | (keyof TTables & string) =
      | DrizzleTable
      | (keyof TTables & string),
    TModelOptions extends ModelBulilderModelOptions<TDb> =
      ModelBulilderModelOptions<TDb>,
  >(
    _table: TTableName,
    options: TModelOptions,
  ) => {
    const table =
      typeof _table === "string" ? builderOptions.schema[_table] : _table;

    return new Model(options) as unknown as IModel<
      TTableName extends DrizzleTable
        ? TTableName
        : TTables[TTableName & keyof TTables],
      TDb,
      TRelations,
      TSchema,
      TTables,
      TConfig
    >;
    // return builderOptions;
  };
}
