import * as schema from "./schema";
import { defineRelations } from "drizzle-orm";

export const relations = defineRelations(schema, (r) => ({
  user: {
    posts: r.many.user(),
  },
}));
