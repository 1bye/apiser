import { modelBuilder } from "../src";
import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";

const model = modelBuilder({
  schema,
  db,
  relations,
});

const userModel = model("user", {});

const testRaw1 = await userModel.age(123).findOne().with({
  posts: true,
});

const testRaw2 = await userModel
  .age(123)
  .findOne()
  .select({
    age: true,
    email: true,
  })
  .with({
    posts: true,
  });

// testRaw2.
