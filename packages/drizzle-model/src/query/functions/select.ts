import type {
	DrizzleRawOutput,
	DrizzleRelations,
	DrizzleSchema,
	DrizzleTable,
	DrizzleVariativeRawOutput,
	IsDrizzleTable,
	PickTrueValues,
} from "@/types";
import type { WithValue } from "./with";
import type {
	RelationsRawResult,
	ResolveRelationType,
	SelectedRelations,
} from "../relations";

export type SelectValue<Table extends DrizzleTable> = {
	[Key in keyof DrizzleRawOutput<Table>]?: boolean;
};

export type SelectValueWithRelations<
	Tables extends DrizzleSchema,
	Relation extends DrizzleRelations,
> = {
	[Key in keyof Relation as IsDrizzleTable<
		Tables[Key & string]
	> extends DrizzleTable
		? Key & string
		: never]?:
		| Partial<
				Record<
					keyof DrizzleRawOutput<
						Extract<
							Tables[Relation[Key & string]["targetTableName"]],
							DrizzleTable
						>
					>,
					boolean
				>
		  >
		| boolean;
};

export type ResolveSelectedRelations<
	Tables extends DrizzleSchema,
	Relation extends DrizzleRelations,
	WithResultValue extends WithValue<Tables, Relation>,
	Value extends Record<string, any>,
> = {
	[Key in keyof WithResultValue as WithResultValue[Key] extends true
		? Key & string
		: never]: Value[Key & string] extends Record<string, any>
		? ResolveRelationType<
				Relation[Key & string],
				PickTrueValues<
					Value[Key & string],
					RelationsRawResult<Tables, Relation[Key & string]>
				>
			>
		: never;
};

export type ResolveSelectedValues<
	Table extends DrizzleTable,
	Value extends SelectValue<Table>,
	Result extends DrizzleVariativeRawOutput<Table>,
> = Result extends DrizzleRawOutput<Table>
	? {
			// single row
			[Key in keyof Value as Value[Key] extends true
				? Key & string
				: never]: Result[Key & string];
		}
	: Result extends DrizzleRawOutput<Table>[]
		? {
				// array of rows
				[Key in keyof Value as Value[Key] extends true
					? Key & string
					: never]: Result[number][Key & string];
			}[]
		: null;
