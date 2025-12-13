import * as schema from "./schema";
import { defineRelations } from "drizzle-orm";
// schema.
export const relations = defineRelations(schema, (r) => ({
	user: {
		posts: r.many.userPosts(),
	},
	userPosts: {
		user: r.one.user(),
	},
}));
