import { describe, expect, test } from "bun:test";
import { model } from "tests/base";
import { db } from "tests/db";
import { esc } from "@/model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Models ───────────────────────────────────────────────────────────────────

/**
 * A user model that defines several custom methods.
 * These must remain accessible after every lifecycle call
 * (.where, .extend, .db).
 */
const userModel = model("user", {});

const serviceQueries = userModel.extend({
	methods: {
		findByName(name: string) {
			return serviceQueries.where({ name: esc(name) }).findFirst();
		},
		findAllVerified() {
			return serviceQueries.where({ isVerified: esc(true) }).findMany();
		},
		findByMinAge(minAge: number) {
			return serviceQueries.where({ age: { gte: esc(minAge) } }).findMany();
		},
	},
});

const postsModel = model("userPosts", {});

const postQueries = postsModel.extend({
	methods: {
		findByTitle(title: string) {
			return postQueries.where({ title: esc(title) }).findFirst();
		},
		findFeatured() {
			return postQueries.where({ featured: esc(true) }).findMany();
		},
	},
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("custom methods", () => {
	// -------------------------------------------------------------------------
	// Presence — methods must be callable on the initial model object
	// -------------------------------------------------------------------------

	describe("presence on initial model", () => {
		test("all declared methods are functions on the model", () => {
			expect(typeof serviceQueries.findByName).toBe("function");
			expect(typeof serviceQueries.findAllVerified).toBe("function");
			expect(typeof serviceQueries.findByMinAge).toBe("function");
		});

		test("multiple models keep their own method sets independent", () => {
			expect(typeof serviceQueries.findByName).toBe("function");
			expect(typeof postQueries.findByTitle).toBe("function");
			// cross-model — methods must NOT bleed across models
			expect(
				(serviceQueries as { findByTitle?: unknown }).findByTitle
			).toBeUndefined();
			expect(
				(postQueries as { findByName?: unknown }).findByName
			).toBeUndefined();
		});
	});

	// -------------------------------------------------------------------------
	// Survival through .where() — THE PRIMARY BUG
	// Custom methods must survive every `.where()` call.
	// -------------------------------------------------------------------------

	describe("survival after .where()", () => {
		test("custom methods are present on the result of .where()", () => {
			const scoped = serviceQueries.where({ age: { gte: esc(0) } });
			expect(typeof scoped.findByName).toBe("function");
			expect(typeof scoped.findAllVerified).toBe("function");
			expect(typeof scoped.findByMinAge).toBe("function");
		});

		test("custom methods are present after chained .where() calls", () => {
			const scoped = serviceQueries
				.where({ age: { gte: esc(0) } })
				.where({ isVerified: esc(false) });
			expect(typeof scoped.findByName).toBe("function");
		});

		test("base methods are still present after .where()", () => {
			const scoped = serviceQueries.where({ age: { gte: esc(0) } });
			expect(typeof scoped.findFirst).toBe("function");
			expect(typeof scoped.findMany).toBe("function");
			expect(typeof scoped.insert).toBe("function");
			expect(typeof scoped.update).toBe("function");
			expect(typeof scoped.delete).toBe("function");
		});
	});

	// -------------------------------------------------------------------------
	// Survival through .extend()
	// -------------------------------------------------------------------------

	describe("survival after .extend()", () => {
		test("original custom methods survive .extend()", () => {
			const extended = serviceQueries.extend({});
			expect(typeof extended.findByName).toBe("function");
			expect(typeof extended.findAllVerified).toBe("function");
		});

		test("new methods added via .extend() are accessible", () => {
			const extended = serviceQueries.extend({
				methods: {
					findAdults() {
						return extended.where({ age: { gte: esc(18) } }).findMany();
					},
				},
			});
			expect(typeof extended.findAdults).toBe("function");
		});

		test("parent custom methods survive on an extended model", () => {
			const extended = serviceQueries.extend({
				methods: {
					findAdults() {
						return extended.where({ age: { gte: esc(18) } }).findMany();
					},
				},
			});
			// Parent methods must still be present on the child
			expect(typeof extended.findByName).toBe("function");
			expect(typeof extended.findAllVerified).toBe("function");
			// New method must be present too
			expect(typeof extended.findAdults).toBe("function");
		});

		test("child method overrides parent method of the same name", () => {
			const SENTINEL = Symbol("override-sentinel");
			const extended = serviceQueries.extend({
				methods: {
					findByName(_name: string) {
						return SENTINEL;
					},
				},
			});
			// The extended model's findByName must shadow the parent's
			expect(extended.findByName("ignored")).toBe(SENTINEL);
		});

		test("custom methods survive .where() on an extended model", () => {
			const extended = serviceQueries.extend({
				methods: {
					findAdults() {
						return extended.where({ age: { gte: esc(18) } }).findMany();
					},
				},
			});
			const scoped = extended.where({ isVerified: esc(true) });
			expect(typeof scoped.findByName).toBe("function");
			expect(typeof scoped.findAdults).toBe("function");
		});
	});

	// -------------------------------------------------------------------------
	// Survival through .db()
	// -------------------------------------------------------------------------

	describe("survival after .db()", () => {
		test("custom methods are present after .db() rebind", () => {
			const rebound = serviceQueries.db(db);
			expect(typeof rebound.findByName).toBe("function");
			expect(typeof rebound.findAllVerified).toBe("function");
			expect(typeof rebound.findByMinAge).toBe("function");
		});

		test("base methods are still present after .db() rebind", () => {
			const rebound = serviceQueries.db(db);
			expect(typeof rebound.findFirst).toBe("function");
			expect(typeof rebound.findMany).toBe("function");
		});

		test("custom methods survive .where() after .db() rebind", () => {
			const rebound = serviceQueries.db(db).where({ age: { gte: esc(0) } });
			expect(typeof rebound.findByName).toBe("function");
		});
	});

	// -------------------------------------------------------------------------
	// Functional correctness — custom methods actually return the right data
	// -------------------------------------------------------------------------

	describe("functional correctness", () => {
		test("findByName returns a single user with matching name", async () => {
			const uniqueName = `TestUser-${uid()}`;
			const uniqueEmail = `${uid()}@custom-methods.test`;

			await serviceQueries.insert({
				name: uniqueName,
				email: uniqueEmail,
				age: 25,
			});

			const result = await serviceQueries.findByName(uniqueName);

			expect(result).toBeDefined();
			expect(result?.name).toBe(uniqueName);
			expect(typeof result?.id).toBe("number");
		});

		test("findAllVerified returns only verified users", async () => {
			const result = await serviceQueries.findAllVerified();

			expect(Array.isArray(result)).toBe(true);
			for (const user of result) {
				expect(user.isVerified).toBe(true);
			}
		});

		test("findByMinAge returns users at or above the age threshold", async () => {
			const result = await serviceQueries.findByMinAge(18);

			expect(Array.isArray(result)).toBe(true);
			for (const user of result) {
				expect(user.age).toBeGreaterThanOrEqual(18);
			}
		});

		test("custom method result is consistent with equivalent base query", async () => {
			const uniqueName = `Consistent-${uid()}`;
			const uniqueEmail = `${uid()}@custom-methods.test`;

			await serviceQueries.insert({
				name: uniqueName,
				email: uniqueEmail,
				age: 30,
			});

			const viaCustom = await serviceQueries.findByName(uniqueName);
			const viaBase = await serviceQueries
				.where({ name: esc(uniqueName) })
				.findFirst();

			expect(viaCustom).toEqual(viaBase);
		});

		test("posts custom method findByTitle returns correct post", async () => {
			const uniqueTitle = `PostTitle-${uid()}`;

			await postQueries.insert({
				title: uniqueTitle,
				featured: false,
				userId: 1,
			});

			const result = await postQueries.findByTitle(uniqueTitle);

			expect(result).toBeDefined();
			expect(result?.title).toBe(uniqueTitle);
		});

		test("posts custom method findFeatured returns only featured posts", async () => {
			await postQueries.insert({
				title: `Featured-${uid()}`,
				featured: true,
				userId: 1,
			});

			const result = await postQueries.findFeatured();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			for (const post of result) {
				expect(post.featured).toBe(true);
			}
		});

		test("custom method is still functional after .where() (the bug scenario)", async () => {
			const uniqueName = `BugCheck-${uid()}`;
			const uniqueEmail = `${uid()}@custom-methods.test`;

			await serviceQueries.insert({
				name: uniqueName,
				email: uniqueEmail,
				age: 99,
			});

			const scopedModel = serviceQueries.where({ age: { gte: esc(0) } });
			const result = await scopedModel.findByName(uniqueName);

			expect(result).toBeDefined();
			expect(result?.name).toBe(uniqueName);
		});

		test("custom method is still functional after .extend()", async () => {
			const uniqueName = `ExtendBug-${uid()}`;
			const uniqueEmail = `${uid()}@custom-methods.test`;

			await serviceQueries.insert({
				name: uniqueName,
				email: uniqueEmail,
				age: 22,
			});

			const extended = serviceQueries.extend({
				format: (u) => ({ ...u, _extended: true }),
			});
			const result = await extended.findByName(uniqueName);

			expect(result).toBeDefined();
			expect(result?.name).toBe(uniqueName);
		});

		test("custom method is still functional after .db()", async () => {
			const uniqueName = `DbBug-${uid()}`;
			const uniqueEmail = `${uid()}@custom-methods.test`;

			await serviceQueries.insert({
				name: uniqueName,
				email: uniqueEmail,
				age: 33,
			});

			const rebound = serviceQueries.db(db);
			const result = await rebound.findByName(uniqueName);

			expect(result).toBeDefined();
			expect(result?.name).toBe(uniqueName);
		});
	});
});
