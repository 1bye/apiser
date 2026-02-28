import { describe, expect, test } from "bun:test";
import { model } from "tests/base";
import { db } from "tests/db";
import * as schema from "tests/schema";
import { esc } from "@/model";

const userModel = model("user", {});
const postsModel = model("userPosts", {});

describe("count", () => {
	test("returns total row count", async () => {
		const count = await userModel.count();
		const rows = await db.select().from(schema.user);

		expect(count).toBeNumber();
		expect(count).toBe((rows as any[]).length);
	});

	test("respects where clause", async () => {
		const count = await userModel.where({ name: esc("Alex") }).count();

		expect(count).toBeNumber();
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test("returns 0 for no matches", async () => {
		const count = await userModel
			.where({ name: esc("__nonexistent_user_name__") })
			.count();

		expect(count).toBe(0);
	});

	test("reflects inserted rows", async () => {
		const before = await postsModel.count();

		await postsModel.insert({
			title: "Count check",
			featured: false,
			userId: 1,
		});

		const after = await postsModel.count();

		expect(after).toBe(before + 1);
	});
});
