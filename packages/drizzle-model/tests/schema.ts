import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core";

// --- TABLES ---

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  age: integer().notNull().default(0),
  isVerified: boolean("is_verified"),
  invitedBy: integer("invited_by"),
});

export const userPosts = pgTable("user_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  likes: integer().notNull().default(0),
  views: integer().notNull().default(0),
  featured: boolean("featured"),

  // Foreign Key
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const postComments = pgTable("user_post_comments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: text("content"),

  // Foreign Keys
  authorId: integer("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  postId: integer("post_id")
    .notNull()
    .references(() => userPosts.id, { onDelete: "cascade" }),
});


export const userIdeas = pgTable("user_ideas", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: text("content"),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
