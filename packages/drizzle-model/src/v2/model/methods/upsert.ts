import type { TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import type { ModelConfig } from "../config";
import type { MethodInsertValue } from "./insert";
import type { MethodUpdateValue } from "./update";
import type { GetPrimarySerialOrDefaultKeys } from "./return";
import type { MethodWhereValue } from "./query/where";
import type { SQL } from "drizzle-orm";
import type { IsTable } from "../table";
import type { AddUnionToValues } from "@/v2/types";

export type MethodUpsertValue<
  TConfig extends ModelConfig,
  TSchema extends TablesRelationalConfig = TConfig["schema"],
  TTable extends TableRelationalConfig = TConfig["table"]
> = {
  insert: MethodInsertValue<TTable>;
  update: MethodUpsertUpdate<TTable>;

  target?: (keyof GetPrimarySerialOrDefaultKeys<
    IsTable<TTable["table"]>["_"]["columns"]
  >)[];
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
