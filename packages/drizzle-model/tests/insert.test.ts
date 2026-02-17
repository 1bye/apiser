import { describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { esc } from "@/model/query/operations";
import { modelBuilder } from "../src";
import { db } from "./db";
import { relations } from "./relations";
import * as schema from "./schema";

const model = modelBuilder({
	schema,
	db,
	relations,
	dialect: "PostgreSQL",
});

const postsModel = model("userPosts", {});
const userModel = model("user", {});

function sortById<T extends { id: number }>(rows: T[]) {
	return [...rows].sort((a, b) => a.id - b.id);
}

describe("Model Update/Delete/Upsert Test", () => {
	test(".update | updates a single post", async () => {
		const [seed] = (await postsModel
			.insert({
				title: "Update seed",
				featured: false,
				userId: 1,
			})
			.return()) as any[];

		const updated = await postsModel
			.where({ id: esc(seed.id) })
			.update({
				title: "Updated title",
				featured: true,
			})
			.return();

		const expected = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, seed.id));

		expect(updated).toBeArray();
		expect((updated as any[])[0].id).toBe(seed.id);
		expect((updated as any[])[0].title).toBe("Updated title");
		expect((updated as any[])[0].featured).toBe(true);
		expect((updated as any[])[0]).toEqual((expected as any[])[0]);
	});

	test(".delete | deletes a single post", async () => {
		const [seed] = (await postsModel
			.insert({
				title: "Delete seed",
				featured: null,
				userId: 1,
			})
			.return()) as any[];

		const deleted = await postsModel
			.where({ id: esc(seed.id) })
			.delete()
			.return();

		const expectedDeleted = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, seed.id));

		expect(deleted).toBeArray();
		expect((deleted as any[])[0].id).toBe(seed.id);
		expect(expectedDeleted).toHaveLength(0);
	});

	test(".upsert | inserts then updates by unique email", async () => {
		const uniq = `${Date.now()}-${Math.random()}`;
		const email = `upsert-${uniq}@example.com`;

		const [created] = (await userModel
			.upsert({
				insert: {
					name: "Upsert user",
					email,
					age: 10,
					isVerified: false,
				},
				update: {
					name: "Upsert user updated",
				},
				target: schema.user.email as any,
			})
			.return()) as any[];

		const [updated] = (await userModel
			.upsert({
				insert: {
					name: "Upsert user (ignored)",
					email,
					age: 10,
					isVerified: false,
				},
				update: {
					name: "Upsert user updated",
				},
				target: schema.user.email as any,
			})
			.return()) as any[];

		const expected = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, email));

		expect(created).toBeDefined();
		expect(updated).toBeDefined();
		expect(updated.id).toBe(created.id);
		expect(updated.name).toBe("Upsert user updated");
		expect(updated).toEqual((expected as any[])[0]);
	});
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
		const inserted: any = await postsModel
			.insert({
				title: "Hello world!",
				featured: true,
				userId: 1,
			})
			.return();

		const expected = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, (inserted as any[])[0].id));

		console.dir(inserted, {
			depth: null,
		});

		expect(inserted).toBeDefined();
		expect(Array.isArray(inserted)).toBe(true);
		expect((inserted as any[])[0]).toBeDefined();
		expect((inserted as any[])[0].title).toBe("Hello world!");
		expect((inserted as any[])[0].featured).toBe(true);
		expect((inserted as any[])[0].userId).toBe(1);
		expect((inserted as any[])[0].likes).toBe(0);
		expect((inserted as any[])[0].views).toBe(0);
		expect((inserted as any[])[0]).toEqual((expected as any[])[0]);
	});

	test(".insert | one entry with defaults", async () => {
		const inserted: any = await postsModel
			.insert({
				title: "Post with defaults",
				userId: 1,
			})
			.return();

		const expected = await db
			.select()
			.from(schema.userPosts)
			.where(eq(schema.userPosts.id, (inserted as any[])[0].id));

		console.dir(inserted, {
			depth: null,
		});

		expect(inserted).toBeDefined();
		expect(Array.isArray(inserted)).toBe(true);
		expect((inserted as any[])[0]).toBeDefined();
		expect((inserted as any[])[0].title).toBe("Post with defaults");
		expect((inserted as any[])[0].userId).toBe(1);

		// description and featured are optional
		expect((inserted as any[])[0].description).toBeNull();
		expect((inserted as any[])[0].featured).toBeNull();

		// likes and views should use table defaults
		expect((inserted as any[])[0].likes).toBe(0);
		expect((inserted as any[])[0].views).toBe(0);
		expect((inserted as any[])[0]).toEqual((expected as any[])[0]);
	});

	test(".insert | multiple entries", async () => {
		const inserted = await postsModel
			.insert([
				{
					title: "First bulk post",
					description: "First bulk description",
					featured: false,
					userId: 1,
				},
				{
					title: "Second bulk post",
					description: "Second bulk description",
					featured: true,
					userId: 1,
				},
			])
			.return();

		const ids = (inserted as any[]).map((x) => x.id);
		const expected = await db
			.select()
			.from(schema.userPosts)
			.where(inArray(schema.userPosts.id, ids));

		console.dir(inserted, {
			depth: null,
		});

		expect(inserted).toBeDefined();
		expect(Array.isArray(inserted)).toBe(true);
		expect(inserted as any[]).toHaveLength(2);

		const [first, second] = inserted as any[];

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

		expect(sortById(inserted as any)).toEqual(sortById(expected as any));
	});
});
