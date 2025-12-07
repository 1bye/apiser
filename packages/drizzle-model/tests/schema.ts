import { pgTable, integer, varchar, text, boolean } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  age: integer().notNull().default(0),
  isVerified: boolean("is_verified"),
});
