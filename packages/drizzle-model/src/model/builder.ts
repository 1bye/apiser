import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import type { ModelConfig } from "./config.ts";
import { makeModelRuntime } from "./core/runtime.ts";
import type { ModelDialect } from "./dialect.ts";
import type { Model } from "./model.ts";
import type { ModelOptions } from "./options.ts";

export function modelBuilder<
	TFullSchema extends Record<string, unknown> = Record<string, never>,
	TRelations extends AnyRelations = EmptyRelations,
	TDialect extends ModelDialect = ModelDialect,
>({
	db,
	relations,
	schema,
	dialect,
}: {
	relations: TRelations;
	db: any;
	schema: TFullSchema;
	dialect: TDialect;
}) {
	return <
		TTableName extends keyof TRelations,
		TOptions extends ModelOptions<
			TRelations,
			TRelations[TTableName],
			TDialect,
			TOptions
		>,
	>(
		table: TTableName,
		options: TOptions
	) => {
		return makeModelRuntime({
			db,
			relations: relations as any,
			schema: schema as any,
			tableName: table as any,
			dialect,
			options: (options ?? {}) as any,
		}) as Model<
			ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
		>;
	};
}
