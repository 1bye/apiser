import type { DrizzleInsertValues } from "@/types";
import type { TableRelationalConfig } from "drizzle-orm/relations";
import type { IsTable } from "../table";

export type MethodUpdateValue<TTable extends TableRelationalConfig> = Partial<DrizzleInsertValues<IsTable<TTable["table"]>>>;
