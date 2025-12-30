import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { relations } from "./relations";

export const mysqlDb = drizzleMysql("nothing");

// mysqlDb.insert().values().$returningId;

export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  relations,
});

// db.query.user.findFirst({
//   with: {
//     posts: {
//       with: {},
//     },
//   },
// });
