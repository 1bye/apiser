import { model } from "../src/model";
import { user, userPosts } from "./schema";
import { db } from "./db";
import { test, describe, expect } from "bun:test";

const postsModel = model({
  db,
  table: userPosts,

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
    const raw: any = await postsModel
      .insert({
        title: "Hello world!",
        featured: true,
      })
      .return();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeDefined();
    expect(Array.isArray(raw)).toBe(true);
    expect((raw as any[])[0]).toBeDefined();
    expect((raw as any[])[0].title).toBe("Hello world!");
    expect((raw as any[])[0].featured).toBe(true);
    // defaults from schema
    expect((raw as any[])[0].likes).toBe(0);
    expect((raw as any[])[0].views).toBe(0);
  });

  test(".insert | one entry with defaults", async () => {
    const raw: any = await postsModel
      .insert({
        title: "Post with defaults",
      })
      .return();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeDefined();
    expect(Array.isArray(raw)).toBe(true);
    expect((raw as any[])[0]).toBeDefined();
    expect((raw as any[])[0].title).toBe("Post with defaults");

    // description and featured are optional
    expect((raw as any[])[0].description).toBeNull();
    expect((raw as any[])[0].featured).toBeNull();

    // likes and views should use table defaults
    expect((raw as any[])[0].likes).toBe(0);
    expect((raw as any[])[0].views).toBe(0);
  });

  test(".insert | multiple entries", async () => {
    const raw: any = await postsModel
      .insert([
        {
          title: "First bulk post",
          description: "First bulk description",
          featured: false,
        },
        {
          title: "Second bulk post",
          description: "Second bulk description",
          featured: true,
        },
      ])
      .return();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeDefined();
    expect(Array.isArray(raw)).toBe(true);
    expect(raw as any[]).toHaveLength(2);

    const [first, second] = raw as any[];

    expect(first.title).toBe("First bulk post");
    expect(first.description).toBe("First bulk description");
    expect(first.featured).toBe(false);
    expect(first.likes).toBe(0);
    expect(first.views).toBe(0);

    expect(second.title).toBe("Second bulk post");
    expect(second.description).toBe("Second bulk description");
    expect(second.featured).toBe(true);
    expect(second.likes).toBe(0);
    expect(second.views).toBe(0);
  });
});
