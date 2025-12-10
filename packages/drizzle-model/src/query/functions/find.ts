import type { DrizzleRelations, DrizzleSchema } from "@/types";
import type { BaseColumnFunctionOptions } from "./base";
import type { WithValue } from "./with";
import type { SelectedRelations } from "../relations";

export type FindOptions = {} & BaseColumnFunctionOptions;

export interface IFindResult<
  Result,
  Tables extends DrizzleSchema,
  Relation extends DrizzleRelations,
> extends Promise<Result> {
  with<Value extends WithValue<Relation>>(
    value: Value,
  ): Promise<SelectedRelations<Tables, Relation, Value> & Result>;
}
