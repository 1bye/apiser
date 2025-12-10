import type { BaseColumnFunctions, ModelColumnFunctions } from "@/column";
import type { ModelQuery } from "@/query";
import type {
  DrizzleColumns,
  DrizzleSchema,
  DrizzleTable,
  IsDrizzleTable,
} from "@/types";
import type {
  ExtractTablesWithRelations,
  RelationsBuilderConfig,
} from "drizzle-orm";

export interface ModelOptions<Table extends DrizzleTable> {
  table: Table;
  db: any;
}

export interface ModelFunctions<
  TTables extends DrizzleSchema,
  TTable extends DrizzleTable,
> extends BaseColumnFunctions<TTables, TTable> {
  limit: (limit: number) => ModelQuery<TTable>;
  offset: (offset: number) => ModelQuery<TTable>;
}

/**
 * Base Model object
 */
export type IModel<
  TTable extends DrizzleTable,
  TDb extends any,
  TRelations extends ExtractTablesWithRelations<TConfig, TTables>,
  TSchema extends Record<string, DrizzleTable> = Record<string, DrizzleTable>,
  TTables extends DrizzleSchema = ExtractTablesFromSchema<TSchema>,
  TConfig extends RelationsBuilderConfig<TTables> =
    RelationsBuilderConfig<TTables>,
> = {
  table: TTable;
  columns: DrizzleColumns<TTable>;
  db: TDb;
  relations: TRelations;
  tableName: TTable["_"]["name"];
} & ModelColumnFunctions<
  /* Tables section */
  TTables,
  /* Table section */
  TTable,
  DrizzleColumns<TTable>,
  keyof DrizzleColumns<TTable> & string,
  /* Relations section */
  TRelations[TTable["_"]["name"]]["relations"],
  keyof TTables & string
> &
  ModelFunctions<TTables, TTable>;

export type ModelBuilderOptions<
  TDb extends any,
  TRelations extends ExtractTablesWithRelations<TConfig, TTables>,
  TSchema extends Record<string, DrizzleTable> = Record<string, DrizzleTable>,
  TTables extends DrizzleSchema = ExtractTablesFromSchema<TSchema>,
  TConfig extends RelationsBuilderConfig<TTables> =
    RelationsBuilderConfig<TTables>,
> = {
  relations: TRelations;
  schema: TSchema;
  db: TDb;
};

export type ModelBulilderModelOptions<TDb extends any> = {
  db?: TDb | any;
};
// & Omit<ModelOptions<any>, "table" | "db">;

export type ExtractTablesFromSchema<TSchema extends Record<string, unknown>> = {
  [K in keyof TSchema as IsDrizzleTable<TSchema[K]> extends never
    ? never
    : K]: IsDrizzleTable<TSchema[K]>;
};
