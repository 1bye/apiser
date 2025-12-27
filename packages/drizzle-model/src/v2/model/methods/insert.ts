import type { DrizzleInsertValues, IsDrizzleTable } from "@/types";
import type { FindTargetTableInRelationalConfig, RelationsRecord, TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";

export type MethodInsertValue<TTable extends TableRelationalConfig> = DrizzleInsertValues<IsDrizzleTable<TTable["table"]>>;

export type MethodWithInsertValue<
  TSchema extends TablesRelationalConfig,
  TRelations extends RelationsRecord,
> = {
    [Key in keyof TRelations]?: DrizzleInsertValues<IsDrizzleTable<
      TSchema[TRelations[Key]["targetTableName"]]["table"]
    >>
  };
