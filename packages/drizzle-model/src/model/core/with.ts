import { executeWithJoins } from "./joins.ts";
import type { QueryState } from "./thenable.ts";

type AnyObj = Record<string, any>;

export async function runWithJoins(args: {
	db: any;
	schema: Record<string, any>;
	relations: Record<string, any>;
	tableName: string;
	table: AnyObj;
	dialect: string;
	whereSql?: any;
	qState: QueryState;
	kind: "many" | "one";
}): Promise<any> {
	return await executeWithJoins({
		db: args.db,
		schema: args.schema,
		relations: args.relations,
		baseTableName: args.tableName,
		baseTable: args.table,
		dialect: args.dialect,
		whereSql: args.whereSql,
		withValue: args.qState.with as any,
		limitOne: args.kind === "one",
	});
}
