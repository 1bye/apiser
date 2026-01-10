import type {
	FindTargetTableInRelationalConfig,
	RelationsRecord,
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { ResolveRelationSelection } from "../relation.ts";

/**
 * Recursive type structure for defining nested relation selections in the .with() method.
 *
 * It maps relation keys to either a boolean (for simple inclusion) or a nested selection object.
 *
 * @typeParam TSchema - Full relational schema
 * @typeParam TRelations - Record of relations for the current level
 */
export type MethodWithValue<
	TSchema extends TablesRelationalConfig,
	TRelations extends RelationsRecord,
> = {
	[Key in keyof TRelations]?:
		| boolean
		| MethodWithValue<
				TSchema,
				FindTargetTableInRelationalConfig<TSchema, TRelations[Key]>["relations"]
		  >
		| object;
};

export type MethodWithResult<
	TValue extends Record<string, any>,
	TResult extends Record<string, any>,
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
	TOutput = ResolveRelationSelection<TValue, TSchema, TTable>,
> = TResult extends any[]
	? TResult extends (infer RItem)[]
		? (TOutput & RItem)[]
		: TOutput & TResult
	: TOutput & TResult;
