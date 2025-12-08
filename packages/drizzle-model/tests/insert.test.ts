import { model } from "../src/model";
import { userTable, postsTable } from "./schema";
import { db } from "./db";
import { test, describe, expect } from "bun:test";

const postsModel = model({
  db,
  table: postsTable,

  // extend: {
  //   query: {
  //     userId: 123,
  //   },
  // },
});

// Returns new model
// postsModel.extend({
//   query: {
//     userId: 123,
//   },
// });

// const userModel = model({
//   table: userTable,
//   db,
// });

describe("Model Insert Test", () => {
  test(".insert | one entry", async () => {
    // const raw = await userModel.name("Alex").find();

    const raw = await postsModel
      .insert({
        title: "Hello world!",
        featured: true,
      })
      .return();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeDefined();
  });
});
