import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import { ModelRuntime } from "../core/runtime.ts";
import type { ModelConfig } from "./config.ts";
import type { ModelDialect } from "./dialect.ts";
import type { Model } from "./model.ts";
import type { ModelOptions } from "./options.ts";

type AnyRecord = Record<string, unknown>;

/**
 * Wraps a {@link ModelRuntime} instance into a plain target object that:
 *
 * 1. Exposes all runtime prototype methods, intercepting any that return a
 *    `ModelRuntime` so the result is re-wrapped (preserving custom methods).
 * 2. Defines the `$model`, `$modelName`, and `$format` identity getters.
 * 3. Attaches user-defined custom methods from `options.methods` via
 *    `runtime.attachMethods`, binding each to the new `target`.
 *
 * This must be called every time a new `ModelRuntime` is produced (e.g. by
 * `.where()`, `.extend()`, `.db()`) so that custom methods are never lost.
 */
function buildTarget(runtime: ModelRuntime): AnyRecord {
	const target: AnyRecord = {};

	for (const key of Object.getOwnPropertyNames(
		Object.getPrototypeOf(runtime)
	)) {
		if (key === "constructor") {
			continue;
		}

		const value = (runtime as unknown as AnyRecord)[key];

		if (typeof value === "function") {
			target[key] = (...args: unknown[]) => {
				const result = (value as (...args: unknown[]) => unknown).apply(
					runtime,
					args
				);

				// Lifecycle methods (where, extend, db) return a new ModelRuntime.
				// Re-wrap it so custom methods are re-attached on the fresh target.
				if (result instanceof ModelRuntime) {
					return buildTarget(result);
				}

				return result;
			};
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
	Object.defineProperty(target, "$where", {
		get: () => runtime.$where,
		enumerable: true,
	});
	Object.defineProperty(target, "$tableName", {
		get: () => runtime.$tableName,
		enumerable: true,
	});

	// Attach user-defined methods, binding each to this target so that `this`
	// inside a custom method refers to the model-like object (with all methods).
	runtime.attachMethods(target);

	return target;
}

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

		return buildTarget(runtime) as unknown as Model<
			ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
		>;
	};
}
