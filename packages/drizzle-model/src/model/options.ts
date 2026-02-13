import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect.ts";
import type { TableOutput } from "./table.ts";
import type { Fallback } from "../types.ts";
import type { MethodWhereValue } from "./methods/query/where.ts";

/**
 * Options to define a model
 */
export interface ModelOptions<
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
  TTable extends TableRelationalConfig = TableRelationalConfig,
  TDialect extends ModelDialect = ModelDialect,
  TSelf extends ModelOptions<any, any, any, TSelf> = ModelOptions<TSchema, TTable, TDialect, any>
> {
  format?: ModelOptionFormat<TTable>;
  where?: MethodWhereValue<TSchema, TTable>;

  // TODO: Make zod schemas
  // insertSchema?: any;
  // updateSchema?: any;

  // TODO: Maybe planned for future releases
  // select?: MethodSelectValue<TableOutput<TTable>>;
  // exclude?: MethodExcludeValue<TableOutput<TTable>>;

  methods?: ModelMethodsFactory;
}

export type ComposeModelOptions<
  O1 extends ModelOptions,
  O2 extends ModelOptions
> = Omit<O1, "format" | "methods"> & {
  format: Fallback<O1["format"], O2["format"]>;
  methods: MergeModelOptionsMethods<O1["methods"], O2["methods"]>;
};

export type ModelOptionFormat<TTable extends TableRelationalConfig> = {
  bivarianceHack(output: TableOutput<TTable>): any;
}["bivarianceHack"];
// export type ModelMethodsFactory = {
//   bivarianceHack(): Record<string, any>;
// }["bivarianceHack"];
export type ModelMethodsFactory = Record<string, any>;

export type ResolveOptionsMethods<TFactory extends ModelMethodsFactory | undefined> =
  (TFactory extends ModelMethodsFactory
    ? TFactory
    : {});

export type ResolveOptionsFormat<TFormat> =
  TFormat extends (...args: any[]) => any
  ? ReturnType<TFormat>
  : undefined;

export type MergeModelOptionsMethods<
  M1 extends ModelMethodsFactory | undefined,
  M2 extends ModelMethodsFactory | undefined
> =
  M1 extends ModelMethodsFactory
  ? M2 extends ModelMethodsFactory
  ? Omit<M2, keyof M1> & M1
  : M1
  : M2;
