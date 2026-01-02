import type { SQL } from "drizzle-orm/sql";
import type { ModelIdentifier } from "../../model";
import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { TableColumn, TableOneRelationsTableName } from "../../table";
import type { IsDrizzleTable } from "@/types";
import type { ColumnValue } from "../../operations";
import type { MethodIncludeIdentifier } from "../include";

export type MethodWhereValue<
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig,
  TValue = ModelIdentifier<TableOneRelationsTableName<TTable>> | SQL | MethodWhereColumns<TTable> | MethodWhereRelations<TSchema, TTable> | MethodIncludeIdentifier<any>
> =
  // Is result of .include fn?
  TValue extends MethodIncludeIdentifier<true>
  ? never
  : (
    // Is SQL?
    TValue extends SQL
    ? TValue
    // Is model?
    : (TValue extends ModelIdentifier<TableOneRelationsTableName<TTable>>
      ? TValue
      // Is columns where clauses?
      : (TValue extends MethodWhereColumns<TTable>
        ? TValue
        // Is relations
        : (TValue extends MethodWhereRelations<TSchema, TTable>
          ? TValue
          : never)
      )
    )
  );

export type MethodWhereRelations<TSchema extends TablesRelationalConfig, TTable extends TableRelationalConfig> = {
  [TableName in keyof TTable["relations"]as TTable["relations"][TableName]["relationType"] extends "many" ? never : TableName]?: RelationWhere<
    // Table
    TSchema[
    // Table name
    TTable["relations"][TableName & string]["targetTableName"]
    ]
  >;
};

export type RelationWhere<TTable extends TableRelationalConfig> = MethodWhereColumns<TTable>;

export type MethodWhereColumns<TTable extends TableRelationalConfig> = {
  [ColumnName in keyof IsDrizzleTable<TTable["table"]>["_"]["columns"]]?: ColumnValue<TableColumn<ColumnName & string, TTable>>
};
