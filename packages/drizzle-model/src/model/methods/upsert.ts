import type { Column, SQL } from "drizzle-orm";
import type {
	TableRelationalConfig,
	TablesRelationalConfig,
} from "drizzle-orm/relations";
import type { AddUnionToValues } from "@/types.ts";
import type { ModelConfig } from "../config.ts";
import type { IsTable } from "../table.ts";
import type { MethodInsertValue } from "./insert.ts";
import type { MethodWhereValue } from "./query/where.ts";
import type { MethodUpdateValue } from "./update.ts";

export type MethodUpsertValue<
	TConfig extends ModelConfig,
	TSchema extends TablesRelationalConfig = TConfig["schema"],
	TTable extends TableRelationalConfig = TConfig["table"],
> = {
	insert: MethodInsertValue<TTable>;
	update: MethodUpsertUpdate<TTable>;

	target?:
		| TConfig["primaryKeys"]
		| TConfig["primaryKeys"][]
		| Column
		| Column[];
	updateWhere?: MethodUpsertUpdateWhere<TSchema, TTable>;
};

export type MethodUpsertContext<
	TTable extends TableRelationalConfig,
	TFields extends string = keyof IsTable<TTable["table"]>["_"]["columns"] &
		string,
> = {
	excluded: (field: TFields) => SQL;
	inserted: (field: TFields) => SQL;
};

export type MethodUpsertContextFunction<
	TTable extends TableRelationalConfig,
	R,
> = (c: MethodUpsertContext<TTable>) => R;

export type MethodUpsertUpdateValue<TTable extends TableRelationalConfig> =
	AddUnionToValues<MethodUpdateValue<TTable>, SQL>;

export type MethodUpsertUpdate<TTable extends TableRelationalConfig> =
	| MethodUpsertUpdateValue<TTable>
	| MethodUpsertContextFunction<TTable, MethodUpsertUpdateValue<TTable>>;

export type MethodUpsertUpdateWhere<
	TSchema extends TablesRelationalConfig,
	TTable extends TableRelationalConfig,
> = MethodUpsertContextFunction<TTable, MethodWhereValue<TSchema, TTable>>;
