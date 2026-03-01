import { beforeAll, describe, expect, test } from "bun:test";
import { model } from "tests/base";
import { esc } from "@/model";

const userModel = model("user", {});

function uid(): string {
	return `${Date.now()}-${Math.random()}`;
}

describe("esc chainable methods", () => {
	let testUserId: number;

	beforeAll(async () => {
		const user = await userModel
			.insert({
				name: "Esc Test User",
				email: `${uid()}@esc.com`,
				age: 25,
			})
			.returnFirst();
		testUserId = user.id;

		await userModel.insert({
			name: "Alice",
			email: `${uid()}@esc.com`,
			age: 30,
		});

		await userModel.insert({
			name: "Bob",
			email: `${uid()}@esc.com`,
			age: 20,
		});
	});

	test("esc.eq() - equality", async () => {
		const users = await userModel.where({ id: esc.eq(testUserId) }).findMany();

		expect(users).toBeArray();
		expect(users.length).toBe(1);
		expect(users[0]?.id).toBe(testUserId);
	});

	test("esc.not() - inequality", async () => {
		const users = await userModel
			.where({ id: esc.not(testUserId) })
			.findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.id).not.toBe(testUserId);
		}
	});

	test("esc.gt() - greater than", async () => {
		const users = await userModel.where({ age: esc.gt(25) }).findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age).toBeGreaterThan(25);
		}
	});

	test("esc.gte() - greater than or equal", async () => {
		const users = await userModel.where({ age: esc.gte(25) }).findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age).toBeGreaterThanOrEqual(25);
		}
	});

	test("esc.lt() - less than", async () => {
		const users = await userModel.where({ age: esc.lt(25) }).findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age).toBeLessThan(25);
		}
	});

	test("esc.lte() - less than or equal", async () => {
		const users = await userModel.where({ age: esc.lte(25) }).findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age).toBeLessThanOrEqual(25);
		}
	});

	test("esc.like() - pattern matching", async () => {
		const users = await userModel.where({ name: esc.like("Esc%") }).findMany();

		expect(users).toBeArray();
		expect(users.length).toBeGreaterThan(0);
		for (const user of users) {
			expect(user.name.startsWith("Esc")).toBe(true);
		}
	});

	test("esc.ilike() - case-insensitive pattern matching", async () => {
		const users = await userModel
			.where({ name: esc.ilike("%alice%") })
			.findMany();

		expect(users).toBeArray();
		expect(users.length).toBeGreaterThan(0);
		for (const user of users) {
			expect(user.name.toLowerCase()).toContain("alice");
		}
	});

	test("esc.in() - value in array", async () => {
		const users = await userModel
			.where({ name: esc.in(["Alice", "Bob"]) })
			.findMany();

		expect(users).toBeArray();
		expect(users.length).toBeGreaterThan(0);
		for (const user of users) {
			expect(["Alice", "Bob"]).toContain(user.name);
		}
	});

	test("esc.nin() - value not in array", async () => {
		const users = await userModel
			.where({ name: esc.nin(["Alice", "Bob"]) })
			.findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(["Alice", "Bob"]).not.toContain(user.name);
		}
	});

	test("esc.between() - value in range", async () => {
		const users = await userModel
			.where({ age: esc.between(20, 30) })
			.findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age).toBeGreaterThanOrEqual(20);
			expect(user.age).toBeLessThanOrEqual(30);
		}
	});

	test("esc.notBetween() - value outside range", async () => {
		const users = await userModel
			.where({ age: esc.notBetween(21, 29) })
			.findMany();

		expect(users).toBeArray();
		for (const user of users) {
			expect(user.age < 21 || user.age > 29).toBe(true);
		}
	});
});
