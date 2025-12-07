import { model } from "../src/model";
import { userTable } from "./schema";
import { db } from "./db";
import { test, describe, expect } from "bun:test";
import { eq } from "drizzle-orm";

const userModel = model({
  table: userTable,
  db,
});

describe("Model Find Test", () => {
  test(".find | one filter", async () => {
    // Eq to:
    // await db.select().from(userTable).where(eq(userTable.name, "Alex"));
    const raw = await userModel.name("Alex").find();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
  });

  test(".find | no filters returns all users", async () => {
    const raw = await userModel.find();

    expect(raw).toBeArray();
    expect(raw).toHaveLength(4);
    expect((raw as any[]).map((u) => u.id).sort()).toEqual([1, 2, 3, 5]);
  });

  test(".find | multiple filters", async () => {
    const raw = await userModel.name("Alex").isVerified(false).age(12).find();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
  });

  test(".find | complex filters 01", async () => {
    const raw = await userModel
      .name({
        or: ["Alex", "Dino"],
      })
      .find();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
  });

  test(".find | complex filters 02", async () => {
    const raw = await userModel
      .name({
        or: ["Alex", "Dino", "Anna"],
      })
      .age({
        gte: 18,
      })
      .find();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
  });

  test(".find | complex filters 03", async () => {
    const raw = await userModel
      .name({
        like: "A%",
      })
      .find();

    console.dir(raw, {
      depth: null,
    });

    expect(raw).toBeArray();
    expect(raw[0]).toBeDefined();
  });

  test(".findOne | returns a single matching user", async () => {
    const anna = await userModel.name("Anna").findOne();

    expect(anna).toBeDefined();
    expect((anna as any).id).toBe(5);
    expect(anna?.email).toBe("an.na@example.com");
  });

  test(".find | clears conditions between calls", async () => {
    const alex = await userModel.name("Alex").find();
    expect((alex as any[]).map((u) => u.id)).toEqual([1]);

    const allUsers = await userModel
      .id({
        gt: 0,
      })
      .find();
    expect(allUsers).toHaveLength(4);
    expect((allUsers as any[]).map((u) => u.id).sort()).toEqual([1, 2, 3, 5]);
  });

  test(".find | in and nin filters", async () => {
    const onlySelectedEmails = await userModel
      .email({
        in: ["alex@example.com", "mar.g@example.com"],
      })
      .find();

    expect((onlySelectedEmails as any[]).map((u) => u.id).sort()).toEqual([
      1, 2,
    ]);

    const excludedEmails = await userModel
      .email({
        nin: ["alex@example.com", "mar.g@example.com"],
      })
      .find();

    expect((excludedEmails as any[]).map((u) => u.id).sort()).toEqual([3, 5]);
  });

  test(".find | range filters (between / notBetween)", async () => {
    const between18And40 = await userModel
      .age({
        between: [18, 40],
      })
      .find();

    expect((between18And40 as any[]).map((u) => u.id).sort()).toEqual([
      2, 3, 5,
    ]);

    const notBetween18And40 = await userModel
      .age({
        notBetween: [18, 40],
      })
      .find();

    expect((notBetween18And40 as any[]).map((u) => u.id).sort()).toEqual([1]);
  });

  test(".find | boolean equal and not filters", async () => {
    const verified = await userModel
      .isVerified({
        equal: true,
      })
      .find();

    expect((verified as any[]).map((u) => u.id).sort()).toEqual([2, 3, 5]);

    const notVerified = await userModel
      .isVerified({
        not: true,
      })
      .find();

    expect((notVerified as any[]).map((u) => u.id)).toEqual([1]);
  });

  test(".find | nested or filters on same column", async () => {
    const raw = await userModel
      .age({
        or: [{ lt: 18 }, { gt: 32 }],
      })
      .find();

    expect((raw as any[]).map((u) => u.id).sort()).toEqual([1, 2]);
  });
});
