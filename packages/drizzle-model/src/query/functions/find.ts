import type {
  DrizzleRelations,
  DrizzleSchema,
  DrizzleTable,
  DrizzleVariativeRawOutput,
} from "@/types";
import type { BaseColumnFunctionOptions } from "./base";
import type { WithValue } from "./with";
import type { SelectedRelations } from "../relations";
import type { ResolveSelectedValues, SelectValue } from "./select";

export type FindOptions = {} & BaseColumnFunctionOptions;

export interface IFindResult<
  Table extends DrizzleTable,
  Tables extends DrizzleSchema,
  Relation extends DrizzleRelations,
  Result extends DrizzleVariativeRawOutput<Table> | any,
> extends Promise<Result> {
  with<Value extends WithValue<Relation>>(
    value: Value,
  ): IFindResult<
    Table,
    Tables,
    Relation,
    SelectedRelations<Tables, Relation, Value> & Result
  >;

  select<Value extends SelectValue<Table> = SelectValue<Table>>(
    value: Value,
  ): Result extends DrizzleVariativeRawOutput<Table>
    ? IFindResult<
        Table,
        Tables,
        Relation,
        ResolveSelectedValues<Table, Value, Result>
      >
    : never;
}
