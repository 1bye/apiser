import type { DrizzleInsertValues, IsDrizzleTable } from "@/types";
import type { TableRelationalConfig } from "drizzle-orm/relations";

export type MethodUpdateValue<TTable extends TableRelationalConfig> = Partial<DrizzleInsertValues<IsDrizzleTable<TTable["table"]>>>;
