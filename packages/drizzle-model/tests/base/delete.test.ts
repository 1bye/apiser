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

describe("delete", () => {
	test("deletes matching rows — return", async () => {
		const seed = await seedPost("Delete seed");

		const rows = (await postsModel
			.where({ id: esc(seed.id) })
			.delete()
			.return()) as any[];

		expect(rows).toBeArray();
		expect(rows[0].id).toBe(seed.id);

		const remaining = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, seed.id));

		expect(remaining).toHaveLength(0);
	});

	test("returnFirst — returns the deleted row", async () => {
		const seed = await seedPost("Delete returnFirst");

		const row = (await postsModel
			.where({ id: esc(seed.id) })
			.delete()
			.returnFirst()) as any;

		expect(row).toBeDefined();
		expect(row.id).toBe(seed.id);
		expect(row.title).toBe("Delete returnFirst");
	});

	test("return > omit — removes specified fields", async () => {
		const seed = await seedPost("Delete omit");

		const rows = (await postsModel
			.where({ id: esc(seed.id) })
			.delete()
			.return()
			.omit({ likes: true, views: true })) as any[];

		expect(rows[0].likes).toBeUndefined();
		expect(rows[0].views).toBeUndefined();
		expect(rows[0].title).toBe("Delete omit");
	});

	test("returnFirst > safe — success", async () => {
		const seed = await seedPost("Delete safe");

		const result = await postsModel
			.where({ id: esc(seed.id) })
			.delete()
			.returnFirst()
			.safe();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect((result.data as any).id).toBe(seed.id);
	});

	test("row is gone after delete", async () => {
		const seed = await seedPost("Delete verify gone");

		await postsModel.where({ id: esc(seed.id) }).delete();

		const remaining = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, seed.id));

		expect(remaining).toHaveLength(0);
	});
});
