import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import type {
  ExtractTablesWithRelations,
  TablesRelationalConfig,
} from "drizzle-orm/_relations";
import type { Model } from "./model";
import type { ModelDialect } from "./dialect";

export function modelBuilder<
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TRelations extends AnyRelations = EmptyRelations,
  TDialect extends ModelDialect = ModelDialect,
>({
  db,
  relations,
  schema,
}: {
  relations: TRelations;
  db: any;
  schema: TFullSchema;
  dialect: TDialect;
}) {
  return <TTableName extends keyof TRelations>(
    table: TTableName,
    options: any,
  ) => {
    return {} as Model<TRelations, TRelations[TTableName], TDialect>;
  };
}
