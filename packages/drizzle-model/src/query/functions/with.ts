import type { ModelColumnFunctions } from "@/column";
import type {
  DrizzleColumns,
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
    : never]?:
    | boolean
    | ModelColumnFunctions<
        IsDrizzleTable<Tables[Key & string]>,
        Tables,
        DrizzleColumns<IsDrizzleTable<Tables[Key & string]>>,
        keyof DrizzleColumns<IsDrizzleTable<Tables[Key & string]>> & string,
        Relation
      >;
};
