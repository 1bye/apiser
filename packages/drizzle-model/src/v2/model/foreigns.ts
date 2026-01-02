import type {
  TableRelationalConfig,
  TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { ModelDialect } from "./dialect";
import type { Model, ModelIdentifier } from "./model";
import type { ModelLevelMethods } from "./methods/levels";

// export type ModelForeignContext<TSchema extends TablesRelationalConfig, TTableName extends string, TDialect extends ModelDialect, ExcludedKeys extends string = string> = Omit<Model<TSchema, TSchema[TTableName], TDialect>, ModelLevelMethods | ExcludedKeys>;
// export type ModelForeignField<TSchema extends TablesRelationalConfig, TTableName extends string, TDialect extends ModelDialect, ExcludedKeys extends string = string> = <TContext extends ModelForeignContext<TSchema, TTableName, TDialect, ExcludedKeys>>(c: TContext) => TContext | any;

// export type ModelForegins<
//   TSchema extends TablesRelationalConfig,
//   TTable extends TableRelationalConfig,
//   TDialect extends ModelDialect,
// > = {
//     [K in keyof TTable["relations"]]: <TName extends string = TTable["relations"][K & string]["targetTableName"], TValue = (ModelForeignField<TSchema, TName, TDialect, K & string>) | ModelIdentifier<TName>>(
//       fn: TValue extends Function
//         ? TValue
//         : (TValue extends ModelIdentifier<TName> ? TValue
//           : never)
//     ) => Omit<Model<TSchema, TTable, TDialect>, K>;
//   };

export type ModelForegins<
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
  TDialect extends ModelDialect,
> = {

  };
