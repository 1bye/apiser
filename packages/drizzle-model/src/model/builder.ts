import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import type { Model } from "./model.ts";
import type { ModelDialect } from "./dialect.ts";
import type { ModelOptions } from "./options.ts";
import type { ModelConfig } from "./config.ts";

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
  return <
    TTableName extends keyof TRelations,
    TOptions extends ModelOptions<
      TRelations,
      TRelations[TTableName],
      TDialect,
      TOptions
    >,
  >(
    table: TTableName,
    options: TOptions,
  ) => {
    return {} as Model<
      ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
    >;
  };
}
