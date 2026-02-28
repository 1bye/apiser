import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect.ts";
import type { MethodWhereValue } from "./methods/query/where.ts";
import type { GetPrimarySerialOrDefaultKeys } from "./methods/return.ts";
import type { ModelOptions, ResolveOptionsFormat } from "./options.ts";
import type { DrizzleColumnDataType } from "./query/operations.ts";
import type { IsTable, TableOutput } from "./table.ts";

export interface ModelConfig<
	TSchema extends TablesRelationalConfig = TablesRelationalConfig,
	TTable extends TableRelationalConfig = TableRelationalConfig,
	TDialect extends ModelDialect = ModelDialect,
	TOptions extends ModelOptions<any> = ModelOptions<any>,
> {
	dialect: TDialect;
	options: TOptions;

	optionsFormat: ResolveOptionsFormat<TOptions["format"]>;

	primaryKeys: keyof GetPrimarySerialOrDefaultKeys<
		IsTable<TTable["table"]>["_"]["columns"]
	>;
	primaryKeysWithDataType: {
		[TKey in keyof GetPrimarySerialOrDefaultKeys<
			IsTable<TTable["table"]>["_"]["columns"]
		>]: DrizzleColumnDataType<IsTable<TTable["table"]>["_"]["columns"][TKey]>;
	};
	schema: TSchema;
	table: TTable;
	tableColumns: IsTable<TTable["table"]>["_"]["columns"];

	// Aliases:
	tableOutput: TableOutput<TTable>;
	whereValue: MethodWhereValue<TSchema, TTable>;
}
