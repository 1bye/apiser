import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect.ts";
import type { ModelOptions, ResolveOptionsFormat } from "./options.ts";
import type { IsTable, TableOutput } from "./table.ts";
import type { GetPrimarySerialOrDefaultKeys } from "./methods/return.ts";
import type { MethodWhereValue } from "./methods/query/where.ts";
import type { DrizzleColumnDataType } from "./query/operations.ts";

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

  // Aliases:
  tableOutput: TableOutput<TTable>;
  tableColumns: IsTable<TTable["table"]>["_"]["columns"];

  optionsFormat: ResolveOptionsFormat<TOptions["format"]>;

  primaryKeys: keyof GetPrimarySerialOrDefaultKeys<
    IsTable<TTable["table"]>["_"]["columns"]
  >
  primaryKeysWithDataType: {
    [TKey in keyof GetPrimarySerialOrDefaultKeys<
      IsTable<TTable["table"]>["_"]["columns"]
    >]: DrizzleColumnDataType<IsTable<TTable["table"]>["_"]["columns"][TKey]>
  }
  whereValue: MethodWhereValue<TSchema, TTable>;
};
