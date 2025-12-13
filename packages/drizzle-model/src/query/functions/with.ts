import type {
	DrizzleRelations,
	DrizzleSchema,
	DrizzleTable,
	IsDrizzleTable,
} from "@/types";

export type WithValue<
	Tables extends DrizzleSchema,
	Relation extends DrizzleRelations = DrizzleRelations,
> = {
	[Key in keyof Relation as IsDrizzleTable<
		Tables[Key & string]
	> extends DrizzleTable
		? Key & string
		: never]?: boolean | object;
};
