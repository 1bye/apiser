import * as schema from "./schema";
import { defineRelations } from "drizzle-orm";
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
    user: r.one.user(),
    comments: r.many.postComments(),
  },
  postComments: {
    author: r.one.user(),
    post: r.one.userPosts(),
  },
  userIdeas: {
    user: r.one.user(),
  }
}));
