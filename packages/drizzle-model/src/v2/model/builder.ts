import type { AnyRelations, EmptyRelations } from "drizzle-orm";
import type { Model } from "./model";
import type { ModelDialect } from "./dialect";
import type { ModelOptions } from "./options";
import type { ModelConfig } from "./config";
import type { ModelShape } from "./shape";

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
      TModel,
      TRelations,
      TRelations[TTableName],
      TDialect
    // ModelShape<ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>>
    >,
    TModel extends Model<
      ModelConfig<TRelations, TRelations[TTableName], TDialect, TOptions>
    >,
  >(
    table: TTableName,
    options: TOptions,
  ) => {
    return {} as TModel;
  };
}
