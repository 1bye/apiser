import type { TableRelationalConfig } from "drizzle-orm/relations";
import type { TableOutput } from "../table";
import type { ModelDialect, ReturningIdDialects } from "../dialect";
import type { InferModelFromColumns } from "drizzle-orm/table";
import type { IsDrizzleTable } from "@/types";
import type { Column } from "drizzle-orm";

// export type GetPrimarySerialOrDefaultKeys<TTable extends TableRelationalConfig, T extends IsDrizzleTable<TTable["table"]>["_"]["columns"] = IsDrizzleTable<TTable["table"]>["_"]["columns"]> = {
//   [K in keyof T]: T[K]['_']['isPrimaryKey'] extends true
//   ? (T[K]['_']['isAutoincrement'] extends true
//     ? K
//     : (T[K]['_']['hasRuntimeDefault'] extends true
//       ? (T[K]['_']['isPrimaryKey'] extends true
//         ? K
//         : never)
//       : never))
//   : ((T[K]['_']['hasRuntimeDefault'] extends true
//     ? (T[K]['_']['isPrimaryKey'] extends true
//       ? K
//       : never)
//     : never));
// };

export type PrimaryKeyKeys<T extends Record<string, Column>> = {
  [K in keyof T]: T[K]['_']['isPrimaryKey'] extends true ? K : never;
}[keyof T];

export type GetPrimarySerialOrDefaultKeys<T extends Record<string, Column>> = {
  [K in PrimaryKeyKeys<T>]: T[K];
};

export type MethodReturnResult<TPayload extends Record<string, any> | any[], TTable extends TableRelationalConfig, TDialect extends ModelDialect> =
  TDialect extends ReturningIdDialects
  ? InferModelFromColumns<GetPrimarySerialOrDefaultKeys<IsDrizzleTable<TTable["table"]>["_"]["columns"]>>
  : (TPayload extends any[]
    ? TableOutput<TTable>[]
    : TableOutput<TTable>);
