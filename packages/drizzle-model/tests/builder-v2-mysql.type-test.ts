import { defineRelations } from "drizzle-orm";
import {
	boolean,
	int,
	mysqlTable,
	text,
	varchar,
} from "drizzle-orm/mysql-core";
import { modelBuilder } from "src/model";
import { esc } from "@/model/query/operations";
import { mysqlDb } from "./db";

const usersTable = mysqlTable("users", {
	id: int("id").primaryKey(),
	name: text("name").notNull(),
	verified: boolean("verified").notNull().default(false),
});

const usersTableDefFn = mysqlTable("users_default_fn", {
	customId: varchar("id", { length: 256 })
		.primaryKey()
		.$defaultFn(() => "123"),
	name: text("name").notNull(),
});

const schema = {
	usersTable,
	usersTableDefFn,
};

const relations = defineRelations(schema, (r) => ({
	usersTable: {},
}));

const model = modelBuilder({
	schema,
	db: mysqlDb,
	relations,
	dialect: "MySQL",
});

const userModel = model("usersTableDefFn", {});

const testRaw1 = await userModel
	.where({
		customId: esc("123"),
	})
	.delete()
	.return();

// testRaw1[0].
