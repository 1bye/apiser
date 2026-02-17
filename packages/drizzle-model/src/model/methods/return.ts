import type { Column } from "drizzle-orm";
import type { InferModelFromColumns } from "drizzle-orm/table";
import type { ModelConfig } from "../config.ts";
import type { ReturningIdDialects } from "../dialect.ts";
import type { ModelFormatValue } from "../format.ts";

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
	[K in keyof T]: T[K]["_"]["isPrimaryKey"] extends true ? K : never;
}[keyof T];

export type GetPrimarySerialOrDefaultKeys<T extends Record<string, Column>> = {
	[K in PrimaryKeyKeys<T>]: T[K];
};

export type MethodReturnResult<
	TResultType extends string,
	TConfig extends ModelConfig,
> = TConfig["dialect"] extends ReturningIdDialects
	? InferModelFromColumns<
			GetPrimarySerialOrDefaultKeys<TConfig["tableColumns"]>
		>
	: TResultType extends "many"
		? ModelFormatValue<TConfig["tableOutput"], TConfig["optionsFormat"]>[]
		: ModelFormatValue<TConfig["tableOutput"], TConfig["optionsFormat"]>;
