import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { model } from "tests/base";
import { db } from "tests/db";
import * as schema from "tests/schema";
import { esc } from "@/model";

const postsModel = model("userPosts", {});

async function seedPost(title: string) {
	const [row] = (await postsModel
		.insert({ title, featured: false, userId: 1 })
		.return()) as any[];
	return row;
}

describe("update", () => {
	test("updates matching rows — return", async () => {
		const seed = await seedPost("Update seed");

		const rows = (await postsModel
			.where({ id: esc(seed.id) })
			.update({ title: "Updated title", featured: true })
			.return()) as any[];

		expect(rows).toBeArray();
		expect(rows[0].id).toBe(seed.id);
		expect(rows[0].title).toBe("Updated title");
		expect(rows[0].featured).toBe(true);
	});

	test("matches raw drizzle after update", async () => {
		const seed = await seedPost("Update drizzle check");

		await postsModel
			.where({ id: esc(seed.id) })
			.update({ title: "Verified update" })
			.return();

		const [expected] = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, seed.id));

		expect((expected as any).title).toBe("Verified update");
	});

	test("returnFirst — returns single object", async () => {
		const seed = await seedPost("Update returnFirst");

		const row = (await postsModel
			.where({ id: esc(seed.id) })
			.update({ title: "First updated" })
			.returnFirst()) as any;

		expect(row).toBeDefined();
		expect(row.id).toBe(seed.id);
		expect(row.title).toBe("First updated");
	});

	test("return > omit — removes specified fields", async () => {
		const seed = await seedPost("Update omit");

		const rows = (await postsModel
			.where({ id: esc(seed.id) })
			.update({ title: "Omitted update" })
			.return()
			.omit({ likes: true, views: true })) as any[];

		expect(rows[0].likes).toBeUndefined();
		expect(rows[0].views).toBeUndefined();
		expect(rows[0].title).toBe("Omitted update");
	});

	test("returnFirst > safe — success", async () => {
		const seed = await seedPost("Update safe");

		const result = await postsModel
			.where({ id: esc(seed.id) })
			.update({ title: "Safe updated" })
			.returnFirst()
			.safe();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect((result.data as any).title).toBe("Safe updated");
	});
});
