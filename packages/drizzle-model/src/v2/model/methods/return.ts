import type { TableRelationalConfig } from "drizzle-orm/relations";
import type { TableOutput } from "../table";

export type MethodReturnResult<TPayload extends Record<string, any> | any[], TTable extends TableRelationalConfig> =
  TPayload extends any[]
  ? TableOutput<TTable>[]
  : TableOutput<TTable>;
