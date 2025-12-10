import { modelBuilder } from "../src/model";
import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";

const model = modelBuilder({
  schema,
  db,
  relations,
});

model(schema.user, {});

const raw = await model("user", {}).age(123).findOne().with({
  posts: true,
});

raw.posts.targetTableName;
