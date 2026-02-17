import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";
// schema.
export const relations = defineRelations(schema, (r) => ({
	user: {
		posts: r.many.userPosts(),
		invitee: r.one.user({
			from: r.user.invitedBy,
			to: r.user.id,
		}),
	},
	userPosts: {
		user: r.one.user({
			from: r.userPosts.userId,
			to: r.user.id,
		}),
		comments: r.many.postComments({
			from: r.userPosts.id,
			to: r.postComments.postId,
		}),
	},
	postComments: {
		author: r.one.user({
			from: r.postComments.authorId,
			to: r.user.id,
		}),
		post: r.one.userPosts({
			from: r.postComments.postId,
			to: r.userPosts.id,
		}),
	},
	userIdeas: {
		user: r.one.user({
			from: r.userIdeas.userId,
			to: r.user.id,
		}),
	},
}));
