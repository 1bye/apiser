import type {
	DrizzleRelations,
	DrizzleSchema,
	DrizzleTable,
	DrizzleVariativeRawOutput,
} from "@/types";
import type { BaseColumnFunctionOptions } from "./base";
import type { WithValue } from "./with";
import type { SelectedRelations } from "../relations";
import type {
	ResolveSelectedRelations,
	ResolveSelectedValues,
	SelectValue,
	SelectValueWithRelations,
} from "./select";

export type FindOptions = {} & BaseColumnFunctionOptions;

export interface IFindResult<
	Table extends DrizzleTable,
	Tables extends DrizzleSchema,
	Relation extends DrizzleRelations,
	Result extends DrizzleVariativeRawOutput<Table> | any,
	WithResultValue extends WithValue<Tables, Relation> | null = null,
> extends Promise<Result> {
	with<Value extends WithValue<Tables, Relation>>(
		value: Value,
	): IFindResult<
		/** Tables */
		Table,
		Tables,
		Relation,
		/** Result */
		SelectedRelations<Tables, Relation, Value> & Result,
		/** Saves */
		Value
	>;

	select<
		SelValue extends SelectValue<Table> = SelectValue<Table>,
		RelationsValue extends Pick<
			SelectValueWithRelations<Tables, Relation>,
			keyof WithResultValue & string
		> = Pick<
			SelectValueWithRelations<Tables, Relation>,
			keyof WithResultValue & string
		>,
		Value extends SelValue & RelationsValue = SelValue & RelationsValue,
	>(
		value: Value,
	): Result extends DrizzleVariativeRawOutput<Table>
		? IFindResult<
				/** Tables */
				Table,
				Tables,
				Relation,
				/** Result */
				WithResultValue extends null
					? ResolveSelectedValues<Table, Value, Result>
					: ResolveSelectedRelations<
							Tables,
							Relation,
							Exclude<WithResultValue, null>,
							Value
						> &
							ResolveSelectedValues<Table, Value, Result>,
				/** Saves */
				WithResultValue
			>
		: never;
}
