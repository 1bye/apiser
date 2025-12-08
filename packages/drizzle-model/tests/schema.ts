import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  age: integer().notNull().default(0),
  isVerified: boolean("is_verified"),
});

export const postsTable = pgTable("user_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  likes: integer().notNull().default(0),
  views: integer().notNull().default(0),
  featured: boolean("featured"),
});
