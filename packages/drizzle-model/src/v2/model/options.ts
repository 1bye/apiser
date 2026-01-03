import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect";
import type { Model } from "./model";
import type { ModelConfig } from "./config";
import type { TableOutput } from "./table";

/**
 * Options to define a model
 */
export interface ModelOptions<
  TModel,
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
  TTable extends TableRelationalConfig = TableRelationalConfig,
  TDialect extends ModelDialect = ModelDialect
> {
  format?: (output: TableOutput<TTable>) => any;

  insertSchema?: any;
  updateSchema?: any;

  methods?: ModelMethodsFactory<TModel>;
}

export type ModelMethodsFactory<
  TModel,
> = (model: TModel) => Record<string, any>;

export type ResolveOptionsMethods<TFactory extends ModelMethodsFactory<any> | undefined> = TFactory extends ModelMethodsFactory<any>
  ? ReturnType<TFactory>
  : {};
