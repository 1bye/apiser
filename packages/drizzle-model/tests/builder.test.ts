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
const postsModel = model("userPosts", {});

const testRaw1 = await userModel
  .age(123)
  .findOne()
  .with({
    // Fix is relations in here are from userModel not from posts
    posts: postsModel.id(123),
  });

testRaw1;

const testRaw2 = await userModel
  .age(123)
  .findOne()
  .with({
    posts: true,
  })
  .select({
    age: true,
    email: true,
  });

testRaw2.posts;
