import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelConfig } from "../config.ts";
import type { MethodInsertValue } from "./insert.ts";
import type { MethodUpdateValue } from "./update.ts";
import type { GetPrimarySerialOrDefaultKeys } from "./return.ts";
import type { MethodWhereValue } from "./query/where.ts";
import type { SQL } from "drizzle-orm";
import type { Column } from "drizzle-orm";
import type { IsTable } from "../table.ts";
import type { AddUnionToValues } from "@/types.ts";

export type MethodUpsertValue<
  TConfig extends ModelConfig,
  TSchema extends TablesRelationalConfig = TConfig["schema"],
  TTable extends TableRelationalConfig = TConfig["table"]
> = {
  insert: MethodInsertValue<TTable>;
  update: MethodUpsertUpdate<TTable>;

  target?:
    | (keyof GetPrimarySerialOrDefaultKeys<
      IsTable<TTable["table"]>["_"]["columns"]
    >)
    | (keyof GetPrimarySerialOrDefaultKeys<
      IsTable<TTable["table"]>["_"]["columns"]
    >)[]
    | Column
    | Column[];
  updateWhere?: MethodUpsertUpdateWhere<TSchema, TTable>;
};

export type MethodUpsertContext<
  TTable extends TableRelationalConfig,
  TFields extends string = (keyof IsTable<TTable["table"]>["_"]["columns"] & string)
> = {
  excluded: (field: TFields) => SQL;
  inserted: (field: TFields) => SQL;
};

export type MethodUpsertContextFunction<TTable extends TableRelationalConfig, R> =
  (c: MethodUpsertContext<TTable>) => R;

export type MethodUpsertUpdateValue<
  TTable extends TableRelationalConfig,
> = AddUnionToValues<
  MethodUpdateValue<TTable>,
  SQL
>;

export type MethodUpsertUpdate<
  TTable extends TableRelationalConfig,
> =
  MethodUpsertUpdateValue<TTable> | MethodUpsertContextFunction<TTable, MethodUpsertUpdateValue<TTable>>;

export type MethodUpsertUpdateWhere<
  TSchema extends TablesRelationalConfig,
  TTable extends TableRelationalConfig
> = MethodUpsertContextFunction<TTable, MethodWhereValue<TSchema, TTable>>;
