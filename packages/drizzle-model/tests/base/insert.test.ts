import { describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { model } from "tests/base";
import { db } from "tests/db";
import * as schema from "tests/schema";

const postsModel = model("userPosts", {});
const userModel = model("user", {});

function uid(): string {
	return `${Date.now()}-${Math.random()}`;
}

describe("insert", () => {
	test("single row — no return", async () => {
		await postsModel.insert({
			title: "Insert no-return",
			featured: false,
			userId: 1,
		});
	});

	test("single row — return", async () => {
		const rows = await postsModel
			.insert({
				title: "Insert return",
				featured: true,
				userId: 1,
			})
			.return();

		expect(rows).toBeArray();
		expect((rows as any[])[0].title).toBe("Insert return");
		expect((rows as any[])[0].featured).toBe(true);
	});

	test("single row — returnFirst", async () => {
		const row = await postsModel
			.insert({
				title: "Insert returnFirst",
				featured: false,
				userId: 1,
			})
			.returnFirst();

		expect(row).toBeDefined();
		expect((row as any).id).toBeNumber();
		expect((row as any).title).toBe("Insert returnFirst");
	});

	test("single row — matches raw drizzle", async () => {
		const [inserted] = (await postsModel
			.insert({
				title: "Insert drizzle check",
				featured: null,
				userId: 1,
			})
			.return()) as any[];

		const [expected] = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, inserted.id));

		expect(inserted).toEqual(expected as any);
	});

	test("single row with defaults", async () => {
		const row = (await postsModel
			.insert({
				title: "Insert defaults",
				userId: 1,
			})
			.returnFirst()) as any;

		expect(row.likes).toBe(0);
		expect(row.views).toBe(0);
		expect(row.description).toBeNull();
		expect(row.featured).toBeNull();
	});

	test("multiple rows — return", async () => {
		const rows = (await postsModel
			.insert([
				{ title: "Bulk 1", featured: false, userId: 1 },
				{ title: "Bulk 2", featured: true, userId: 1 },
			])
			.return()) as any[];

		const ids = rows.map((r) => r.id);
		const expected = await db
			.select()
			.from(schema.userPosts)
			.where(inArray(schema.userPosts.id, ids));

		expect(rows).toHaveLength(2);
		expect(rows[0].title).toBe("Bulk 1");
		expect(rows[1].title).toBe("Bulk 2");
		expect(rows.sort((a, b) => a.id - b.id)).toEqual(
			(expected as any[]).sort((a, b) => a.id - b.id)
		);
	});

	test("return > omit — removes specified fields", async () => {
		const rows = (await userModel
			.insert({
				email: `${uid()}@test.com`,
				name: "Omit test",
				age: 99,
				secretField: 42,
			})
			.return()
			.omit({ age: true, secretField: true })) as any[];

		for (const row of rows) {
			expect(row.age).toBeUndefined();
			expect(row.secretField).toBeUndefined();
			expect(row.name).toBe("Omit test");
		}
	});

	test("returnFirst > omit — removes specified fields", async () => {
		const row = (await userModel
			.insert({
				email: `${uid()}@test.com`,
				name: "Omit first test",
				age: 55,
				secretField: 7,
			})
			.returnFirst()
			.omit({ age: true, secretField: true })) as any;

		expect(row.age).toBeUndefined();
		expect(row.secretField).toBeUndefined();
		expect(row.name).toBe("Omit first test");
	});

	test("returnFirst > safe — success", async () => {
		const result = await userModel
			.insert({
				email: `${uid()}@test.com`,
				name: "Safe test",
				age: 20,
			})
			.returnFirst()
			.safe();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect((result.data as any).name).toBe("Safe test");
	});
});
