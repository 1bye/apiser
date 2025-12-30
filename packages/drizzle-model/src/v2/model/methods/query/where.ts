import type { SQL } from "drizzle-orm/sql";
import type { ModelIdentifier } from "../../model";
import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { TableRelationsTableName } from "../../table";

export type MethodWhereValue<
  TTable extends TableRelationalConfig,
  TValue = ModelIdentifier<TableRelationsTableName<TTable>> | SQL
> = TValue extends SQL
  ? TValue
  : (TValue extends ModelIdentifier<TableRelationsTableName<TTable>>
    ? TValue
    : never);
