// import type { DrizzleInsertValues, IsDrizzleTable } from "@/types";
import type { RelationsRecord, TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { IsTable, NormalizeTable, TableInsertValues } from "../table.ts";

export type MethodInsertValue<TTable extends TableRelationalConfig> = TableInsertValues<
  NormalizeTable<TTable>
>;

export type MethodWithInsertValue<
  TSchema extends TablesRelationalConfig,
  TRelations extends RelationsRecord,
> = {
    [Key in keyof TRelations]?: TableInsertValues<IsTable<
      TSchema[TRelations[Key]["targetTableName"]]["table"]
    >>
  };
