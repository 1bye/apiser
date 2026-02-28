import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import { ModelRuntime } from "../core/runtime.ts";
import type { ModelConfig } from "./config.ts";
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
		const runtime = new ModelRuntime({
			db,
			relations: relations as unknown as Record<
				string,
				Record<string, unknown>
			>,
			schema: schema as unknown as Record<string, Record<string, unknown>>,
			tableName: table as string,
			dialect,
			options: (options ?? {}) as any,
		});

		const target: Record<string, unknown> = {};

		for (const key of Object.getOwnPropertyNames(
			Object.getPrototypeOf(runtime)
		)) {
			if (key === "constructor") {
				continue;
			}
			const value = (runtime as unknown as Record<string, unknown>)[key];
			if (typeof value === "function") {
				target[key] = value.bind(runtime);
			}
		}

		Object.defineProperty(target, "$model", {
			get: () => runtime.$model,
			enumerable: true,
		});
		Object.defineProperty(target, "$modelName", {
			get: () => runtime.$modelName,
			enumerable: true,
		});
		Object.defineProperty(target, "$format", {
			get: () => runtime.$format,
			enumerable: true,
		});

		runtime.attachMethods(target);

		return target as unknown as Model<
			ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
		>;
	};
}
