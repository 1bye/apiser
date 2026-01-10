import { modelBuilder } from "../src";
import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";
import { test, describe, expect } from "bun:test";
import { esc } from "@/model/query/operations";
import { and, eq, gte, like, or } from "drizzle-orm";

const model = modelBuilder({
  schema,
  db,
  relations,
  dialect: "PostgreSQL",
});

const userModel = model("user", {});

async function rawUsers(where?: any) {
  if (where) {
    return await db.select().from(schema.user).where(where);
  }
  return await db.select().from(schema.user);
}

function sortById<T extends { id: number }>(rows: T[]) {
  return [...rows].sort((a, b) => a.id - b.id);
}

describe("Model Find Test", () => {
  test(".find | one filter", async () => {
    // Eq to:
    // await db.select().from(userTable).where(eq(userTable.name, "Alex"));
    const raw = await userModel.where({ name: esc("Alex") }).findMany();

    const expected = await rawUsers(eq(schema.user.name, "Alex"));

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".find | no filters returns all users", async () => {
    const raw = await userModel.findMany();

    const expected = await rawUsers();

    expect(raw).toBeArray();
    expect(raw).toHaveLength(4);
    expect((raw as any[]).map((u) => u.id).sort()).toEqual([1, 2, 3, 5]);
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".find | multiple filters", async () => {
    const raw = await userModel.where({
      name: esc("Alex"),
      isVerified: esc(false),
      age: esc(12),
    }).findMany();

    const expected = await rawUsers(and(
      eq(schema.user.name, "Alex"),
      eq(schema.user.isVerified, false),
      eq(schema.user.age, 12),
    ));

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".find | complex filters 01", async () => {
    const raw = await userModel.where({
      name: {
        or: [esc("Alex"), esc("Dino")],
      },
    }).findMany();

    const expected = await rawUsers(or(
      eq(schema.user.name, "Alex"),
      eq(schema.user.name, "Dino"),
    ));

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".find | complex filters 02", async () => {
    const raw = await userModel.where({
      name: {
        or: [esc("Alex"), esc("Dino"), esc("Anna")],
      },
      age: {
        gte: esc(18),
      },
    }).findMany();

    const expected = await rawUsers(and(
      or(
        eq(schema.user.name, "Alex"),
        eq(schema.user.name, "Dino"),
        eq(schema.user.name, "Anna"),
      ),
      gte(schema.user.age, 18),
    ));

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".find | complex filters 03", async () => {
    const raw = await userModel.where({
      name: {
        like: esc("A%"),
      },
    }).findMany();

    const expected = await rawUsers(like(schema.user.name, "A%"));

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
    expect(sortById(raw as any)).toEqual(sortById(expected as any));
  });

  test(".findOne | returns a single matching user", async () => {
    const anna = await userModel.where({ name: esc("Anna") }).findFirst();

    const expected = (await rawUsers(eq(schema.user.name, "Anna")))[0];

    expect(anna).toBeDefined();
    expect((anna as any).id).toBe(5);
    expect(anna?.email).toBe("an.na@example.com");
    expect(anna as any).toEqual(expected as any);
  });
});
