import type {
  DrizzleAnyRelation,
  DrizzleRawOutput,
  DrizzleRelations,
  DrizzleSchema,
  DrizzleTable,
  IsDrizzleTable,
} from "@/types";
import type { WithValue } from "./functions/with";

export type SelectedRelations<
  Tables extends DrizzleSchema,
  Relations extends DrizzleRelations,
  Value extends WithValue<Relations>,
> = {
  [Key in keyof Value as Value[Key] extends true
    ? Key & string
    : never]: RelationResult<Tables, Relations[Key & string]>;
};

export type RelationResult<
  Tables extends DrizzleSchema,
  Relation extends DrizzleAnyRelation,
> = Relation["relationType"] extends "many"
  ? RelationsRawResult<Tables, Relation>[]
  : RelationsRawResult<Tables, Relation>;

export type RelationsRawResult<
  Tables extends DrizzleSchema,
  Relation extends DrizzleAnyRelation,
> =
  IsDrizzleTable<Tables[Relation["targetTableName"]]> extends DrizzleTable
    ? DrizzleRawOutput<IsDrizzleTable<Tables[Relation["targetTableName"]]>>
    : never;
