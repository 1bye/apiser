import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect";
import type { ModelOptions } from "./options";

export type ModelConfig<
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
  TTable extends TableRelationalConfig = TableRelationalConfig,
  TDialect extends ModelDialect = ModelDialect,
  TOptions extends ModelOptions<any> = ModelOptions<any>
> = {
  schema: TSchema;
  table: TTable;
  dialect: TDialect;
  options: TOptions;
};
