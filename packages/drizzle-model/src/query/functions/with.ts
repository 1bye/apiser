import type { DrizzleRelations } from "@/types";

export type WithValue<Relation extends DrizzleRelations = DrizzleRelations> = {
  [Key in keyof Relation]?: boolean;
};
