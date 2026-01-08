import type { TableRelationalConfig } from "drizzle-orm/relations";
import type { IsTable, TableInsertValues } from "../table";

export type MethodUpdateValue<TTable extends TableRelationalConfig> = Partial<TableInsertValues<IsTable<TTable["table"]>>>;
