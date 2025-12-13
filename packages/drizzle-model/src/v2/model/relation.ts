import type { DrizzleRawOutput, IsDrizzleTable } from "@/types";
import type {
	FindTargetTableInRelationalConfig,
	RelationsRecord,
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";

export type RelationKind = "one" | "many";

export type ApplyRelationCardinality<
	Kind extends RelationKind,
	T,
> = Kind extends "many" ? T[] : T;

export type RelationMeta<
	TTable extends TableRelationalConfig,
	Key extends string,
> = TTable["relations"][Key];

export type TargetTable<
	TSchema extends TablesRelationalConfig,
	Meta extends { targetTableName: string },
> = TSchema[Meta["targetTableName"]];

export type RelationTargetRow<
	Key extends string,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = DrizzleRawOutput<
	IsDrizzleTable<TargetTable<TSchema, RelationMeta<TTable, Key>>["table"]>
>;

export type ResolveSingleRelation<
	Key extends string,
	Value,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = Value extends Record<string, any>
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

export type ResolveRelationSelection<
	TSelection extends Record<string, any>,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = {
	[Key in keyof TSelection as TSelection[Key] extends true | object
		? Key & string
		: never]: ResolveSingleRelation<
		Key & string,
		TSelection[Key],
		TSchema,
		TTable
	>;
};
