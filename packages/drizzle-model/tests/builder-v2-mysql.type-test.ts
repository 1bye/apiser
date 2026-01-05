import { mysqlDb } from "./db";
import { modelBuilder } from "@/v2/model";
import { boolean, int, text, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { defineRelations } from "drizzle-orm";

const usersTable = mysqlTable('users', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
  verified: boolean('verified').notNull().default(false),
});


const usersTableDefFn = mysqlTable('users_default_fn', {
  customId: varchar('id', { length: 256 }).primaryKey().$defaultFn(() => "123"),
  name: text('name').notNull(),
});


const schema = {
  usersTable,
  usersTableDefFn
};

const relations = defineRelations(schema, (r) => ({
  usersTable: {}
}));

const model = modelBuilder({
  schema,
  db: mysqlDb,
  relations,
  dialect: "MySQL"
});



const userModel = model("usersTableDefFn", {});

const testRaw1 = await userModel.where({
  customId: "123"
}).delete().return();

// testRaw1[0].
