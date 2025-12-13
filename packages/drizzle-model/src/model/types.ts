import type { BaseColumnFunctions, ModelColumnFunctions } from "@/column";
import type { ModelQuery } from "@/query";
import type {
	DrizzleColumns,
	DrizzleRelations,
	DrizzleSchema,
	DrizzleTable,
	ExtactKeysWithTrue,
	IsDrizzleTable,
} from "@/types";
import type {
	ExtractTablesWithRelations,
	RelationsBuilderConfig,
} from "drizzle-orm";

export interface ModelOptions<Table extends DrizzleTable> {
	table: Table;
	db: any;
}

export interface ModelFunctions<
	TTables extends DrizzleSchema,
	TTable extends DrizzleTable,
> extends BaseColumnFunctions<TTable, TTables> {
	limit: (limit: number) => ModelQuery<TTable>;
	offset: (offset: number) => ModelQuery<TTable>;
}

/**
 * Base Model object
 */
export type IModel<
	TTable extends DrizzleTable,
	TDb extends any,
	TRelations extends ExtractTablesWithRelations<TConfig, TTables>,
	TSchema extends Record<string, DrizzleTable> = Record<string, DrizzleTable>,
	TTables extends DrizzleSchema = ExtractTablesFromSchema<TSchema>,
	TConfig extends
		RelationsBuilderConfig<TTables> = RelationsBuilderConfig<TTables>,
> = {
	table: TTable;
	columns: DrizzleColumns<TTable>;
	db: TDb;
	relations: TRelations;
	tableName: ResolveSchemaTableName<TTables, TTable>;
} & ModelColumnFunctions<
	/* Table section */
	TTable,
	/* Tables section */
	TTables,
	/* Table columns section */
	DrizzleColumns<TTable>,
	keyof DrizzleColumns<TTable> & string,
	/* Relations section */
	TRelations[ResolveSchemaTableName<
		TTables,
		TTable
	>]["relations"] extends undefined
		? DrizzleRelations
		: TRelations[ResolveSchemaTableName<TTables, TTable>]["relations"]
> &
	ModelFunctions<TTables, TTable>;

export type ResolveSchemaTableName<
	Tables extends DrizzleSchema,
	Table extends DrizzleTable,
> = ExtactKeysWithTrue<{
	[Key in keyof Tables as Tables[Key]["_"]["name"] extends Table["_"]["name"]
		? Key
		: never]: true;
}>;

export type IAnyModel = any;

export type ModelBuilderOptions<
	TDb extends any,
	TRelations extends ExtractTablesWithRelations<TConfig, TTables>,
	TSchema extends Record<string, DrizzleTable> = Record<string, DrizzleTable>,
	TTables extends DrizzleSchema = ExtractTablesFromSchema<TSchema>,
	TConfig extends
		RelationsBuilderConfig<TTables> = RelationsBuilderConfig<TTables>,
> = {
	relations: TRelations;
	schema: TSchema;
	db: TDb;
};

export type ModelBulilderModelOptions<TDb extends any> = {
	db?: TDb | any;
};
// & Omit<ModelOptions<any>, "table" | "db">;

export type ExtractTablesFromSchema<TSchema extends Record<string, unknown>> = {
	[K in keyof TSchema as IsDrizzleTable<TSchema[K]> extends never
		? never
		: K]: IsDrizzleTable<TSchema[K]>;
};
