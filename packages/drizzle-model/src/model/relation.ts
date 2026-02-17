import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { RecursiveBooleanRecord } from "../types.ts";
import type { ModelIdentifier } from "./model.ts";
import type { IsTable, TableOutput } from "./table.ts";

/**
 * Defines the cardinality of a relation: "one" (hasOne) or "many" (hasMany).
 */
export type RelationKind = "one" | "many";

/**
 * Utility type to wrap a type T in an array if the relation kind is "many",
 * otherwise returns T as is.
 *
 * @typeParam Kind - "one" or "many"
 * @typeParam T - The type to potentially wrap
 */
export type ApplyRelationCardinality<
	Kind extends RelationKind,
	T,
> = Kind extends "many" ? T[] : T;

/**
 * Extracts the metadata for a specific relation from a table's configuration.
 *
 * @typeParam TTable - Relational configuration for the table
 * @typeParam Key - Name of the relation field
 */
export type RelationMeta<
	TTable extends TableRelationalConfig,
	Key extends string,
> = TTable["relations"][Key];

/**
 * Resolves the configuration of the target table in a relation.
 *
 * @typeParam TSchema - Full relational schema
 * @typeParam Meta - Metadata object containing the target table name
 */
export type TargetTable<
	TSchema extends TablesRelationalConfig,
	Meta extends { targetTableName: string },
> = TSchema[Meta["targetTableName"]];

/**
 * Resolves the raw row type of a related table.
 *
 * @typeParam Key - Name of the relation
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the source table
 */
export type RelationTargetRow<
	Key extends string,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = TableOutput<
	IsTable<TargetTable<TSchema, RelationMeta<TTable, Key>>["table"]>
>;

/**
 * Resolves the type of a single relation field based on the selection value.
 *
 * If the value is a nested selection object, it recursively resolves that selection
 * and merges it with the target row type.
 * Finally, it applies the correct cardinality (array or single object).
 *
 * @typeParam Key - Name of the relation
 * @typeParam Value - The selection value (boolean or nested object)
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the source table
 */
export type ResolveSingleRelation<
	Key extends string,
	Value,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> =
	Value extends Record<string, any>
		? ApplyRelationCardinality<
				RelationMeta<TTable, Key>["relationType"],
				ResolveRelationSelection<
					Value,
					TSchema,
					TargetTable<TSchema, RelationMeta<TTable, Key>>
				> &
					RelationTargetRow<Key, TSchema, TTable>
			>
		: ApplyRelationCardinality<
				RelationMeta<TTable, Key>["relationType"],
				RelationTargetRow<Key, TSchema, TTable>
			>;

/**
 * Recursively resolves a selection object into a typed result object.
 *
 * Iterates over keys in the selection that are true or objects, resolving
 * each relation and building the final output type.
 *
 * @typeParam TSelection - The selection object passed to .with()
 * @typeParam TSchema - Full relational schema
 * @typeParam TTable - Relational configuration for the current table
 */
export type ResolveRelationSelection<
	TSelection extends Record<string, any>,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = {
	[Key in keyof TSelection as TSelection[Key] extends
		| true
		| RecursiveBooleanRecord
		| ModelIdentifier<any>
		? Key & string
		: never]: ResolveSingleRelation<
		Key & string,
		TSelection[Key],
		TSchema,
		TTable
	>;
};
