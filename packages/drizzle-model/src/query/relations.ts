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
  [K in keyof Value as Value[K] extends true
    ? K & string
    : never]: RelationResult<Tables, Relations[K & string]>;
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
