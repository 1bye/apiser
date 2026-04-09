import { describe, expect, test } from "bun:test";
import { asc, desc, eq } from "drizzle-orm";
import { model } from "tests/base";
import { db } from "tests/db";
import * as schema from "tests/schema";
import { esc } from "@/model";

const userModel = model("user", {});
const userModelFormat = model("user", {
	format({ secretField, isVerified, ...rest }) {
		return {
			...rest,
			isVerified: !!isVerified,
			customField: "Hello World" as const,
		};
	},
});

describe("find", () => {
	// -----------------------------------------------------------------------
	// findFirst
	// -----------------------------------------------------------------------

	describe("findFirst", () => {
		test("returns a single row", async () => {
			const user = await userModel.findFirst();

			expect(user).toBeDefined();
			expect(user.id).toBeNumber();
		});

		test("where — equality", async () => {
			const user = await userModel.where({ name: esc("Alex") }).findFirst();

			expect(user).toBeDefined();
			expect(user.name).toBe("Alex");
		});

		test("where — like operator", async () => {
			const user = await userModel.where({ name: { like: "An%" } }).findFirst();

			expect(user).toBeDefined();
			expect(user.name.startsWith("An")).toBe(true);
		});

		test("where — or combinator", async () => {
			const user = await userModel
				.where({ name: { or: [esc("Alex"), esc("Anna")] } })
				.findFirst();

			expect(user).toBeDefined();
			expect(["Alex", "Anna"]).toContain(user.name);
		});

		test("select — picks only specified fields", async () => {
			const user = await userModel.findFirst().select({
				name: true,
				age: true,
			});

			expect(user.name).toBeDefined();
			expect(user.age).toBeDefined();
			// @ts-expect-error
			expect(user.email).toBeUndefined();
		});

		test("exclude — removes specified fields", async () => {
			const user = await userModel.findFirst().exclude({
				name: true,
			});

			// @ts-expect-error
			expect(user.name).toBeUndefined();
			expect(user.id).toBeDefined();
		});

		test("format — applies format function", async () => {
			const user = await userModelFormat.findFirst();

			expect(user.customField).toBe("Hello World");
			// @ts-expect-error
			expect(user.secretField).toBeUndefined();
			expect(typeof user.isVerified).toBe("boolean");
		});

		test("raw — skips format", async () => {
			const user = await userModelFormat.findFirst().raw();

			expect(user.secretField).toBeDefined();
		});

		test("matches raw drizzle query", async () => {
			const user = await userModel.where({ name: esc("Alex") }).findFirst();

			const [expected] = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.name, "Alex"))
				.limit(1);

			expect(user).toEqual(expected as any);
		});

		test("safe — wraps result in { data, error }", async () => {
			const result = await userModel.findFirst().safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			expect((result.data as any).id).toBeNumber();
		});
	});

	// -----------------------------------------------------------------------
	// findMany
	// -----------------------------------------------------------------------

	describe("findMany", () => {
		test("returns all rows", async () => {
			const users = await userModel.findMany();
			const expected = await db.select().from(schema.user);

			expect(users).toBeArray();
			expect(users).toHaveLength((expected as any[]).length);
		});

		test("where — equality", async () => {
			const users = await userModel.where({ name: esc("Alex") }).findMany();

			expect(users).toBeArray();
			for (const user of users) {
				expect(user.name).toBe("Alex");
			}
		});

		test("where — multiple filters (AND)", async () => {
			const users = await userModel
				.where({
					name: esc("Alex"),
					isVerified: esc(false),
				})
				.findMany();

			for (const user of users) {
				expect(user.name).toBe("Alex");
				expect(user.isVerified).toBe(false);
			}
		});

		test("where — gte operator", async () => {
			const users = await userModel.where({ age: { gte: esc(18) } }).findMany();

			for (const user of users) {
				expect(user.age).toBeGreaterThanOrEqual(18);
			}
		});

		test("select — picks only specified fields", async () => {
			const users = await userModel.findMany().select({
				name: true,
				age: true,
			});

			for (const user of users) {
				expect(user.name).toBeDefined();
				expect(user.age).toBeDefined();
				// @ts-expect-error
				expect(user.email).toBeUndefined();
			}
		});

		test("exclude — removes specified fields", async () => {
			const users = await userModel.findMany().exclude({
				name: true,
			});

			for (const user of users) {
				// @ts-expect-error
				expect(user.name).toBeUndefined();
				expect(user.id).toBeDefined();
			}
		});

		test("format — applies format function", async () => {
			const users = await userModelFormat.findMany();

			for (const user of users) {
				expect(user.customField).toBe("Hello World");
				// @ts-expect-error
				expect(user.secretField).toBeUndefined();
			}
		});

		test("raw — skips format", async () => {
			const users = await userModelFormat.findMany().raw();

			for (const user of users) {
				expect(user.secretField).toBeDefined();
			}
		});

		test("safe — wraps result in { data, error }", async () => {
			const result = await userModel.findMany().safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			expect(result.data).toBeArray();
		});
	});

	// -----------------------------------------------------------------------
	// Model-level methods: orderBy, limit, select, exclude
	// -----------------------------------------------------------------------

	describe("model-level methods", () => {
		test("orderBy — sorts results ascending with object syntax", async () => {
			const users = await userModel.orderBy({ age: "asc" }).findMany();
			expect(users).toBeArray();
			if (users.length >= 2) {
				expect(users[0].age).toBeLessThanOrEqual(users[1].age);
			}
		});

		test("orderBy — sorts results descending with object syntax", async () => {
			const users = await userModel.orderBy({ age: "desc" }).findMany();
			expect(users).toBeArray();
			if (users.length >= 2) {
				expect(users[0].age).toBeGreaterThanOrEqual(users[1].age);
			}
		});

		test("orderBy — works with Drizzle asc()", async () => {
			const users = await userModel.orderBy(asc(schema.user.age)).findMany();
			expect(users).toBeArray();
			if (users.length >= 2) {
				expect(users[0].age).toBeLessThanOrEqual(users[1].age);
			}
		});

		test("orderBy — works with Drizzle desc()", async () => {
			const users = await userModel.orderBy(desc(schema.user.age)).findMany();
			expect(users).toBeArray();
			if (users.length >= 2) {
				expect(users[0].age).toBeGreaterThanOrEqual(users[1].age);
			}
		});

		test("orderBy — chains with where()", async () => {
			const users = await userModel
				.where({ age: { gte: 18 } })
				.orderBy({ age: "desc" })
				.findMany();
			expect(users).toBeArray();
			if (users.length >= 2) {
				expect(users[0].age).toBeGreaterThanOrEqual(users[1].age);
				expect(users[0].age).toBeGreaterThanOrEqual(18);
			}
		});

		test("limit — restricts number of results", async () => {
			const users = await userModel.limit(2).findMany();
			expect(users).toBeArray();
			expect(users.length).toBeLessThanOrEqual(2);
		});

		test("limit — chains with where()", async () => {
			const users = await userModel
				.where({ age: { gte: 0 } })
				.limit(1)
				.findMany();
			expect(users).toBeArray();
			expect(users.length).toBeLessThanOrEqual(1);
		});

		test("select — works at model level with object syntax", async () => {
			const users = await userModel.select({ id: true, name: true }).findMany();
			for (const user of users) {
				expect(user.id).toBeDefined();
				expect(user.name).toBeDefined();
				expect(user.age).toBeUndefined();
			}
		});

		test("select — works at model level with array syntax", async () => {
			const users = await userModel.select(["id", "name"]).findMany();
			for (const user of users) {
				expect(user.id).toBeDefined();
				expect(user.name).toBeDefined();
				expect(user.age).toBeUndefined();
			}
		});

		test("exclude — works at model level", async () => {
			const users = await userModel.exclude({ secretField: true }).findMany();
			for (const user of users) {
				expect(user.secretField).toBeUndefined();
				expect(user.name).toBeDefined();
			}
		});

		test("combined — orderBy + limit + select", async () => {
			const users = await userModel
				.orderBy({ age: "desc" })
				.limit(2)
				.select({ id: true, age: true })
				.findMany();
			expect(users).toBeArray();
			expect(users.length).toBeLessThanOrEqual(2);
			if (users.length >= 2) {
				expect(users[0].age).toBeGreaterThanOrEqual(users[1].age);
			}
		});
	});
});
