import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { relations } from "./relations";

export const db = drizzle(process.env.DATABASE_URL!, {
	schema,
	relations,
});

db.query.user.findFirst({
	with: {
		posts: {
			with: {},
		},
	},
});
