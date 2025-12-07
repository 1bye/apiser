import { pgTable, integer, varchar, text, boolean } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { model } from "../src/model";
import { eq } from "drizzle-orm";

const db = drizzle("");

const table = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  isVerified: boolean("is_verified"),
});

const userModel = model({
  table,
});

// table.$inferInsert

// console.log();
userModel
  .name({
    or: ["Alex"],
  })
  // .or({
  //   id: [{  }]
  // })
  .isVerified(true)
  .find();
// db.select().from(table).where(eq(table.isVerified, "true"));

// userModel.table.
