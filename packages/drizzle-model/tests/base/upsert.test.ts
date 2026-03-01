import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { model } from "tests/base";
import { db } from "tests/db";
import * as schema from "tests/schema";

const userModel = model("user", {});

function uid(): string {
	return `${Date.now()}-${Math.random()}`;
}

describe("upsert", () => {
	test("inserts when no conflict", async () => {
		const email = `upsert-new-${uid()}@test.com`;

		const [row] = (await userModel
			.upsert({
				insert: { name: "Upsert new", email, age: 25 },
				update: { name: "Should not apply" },
				target: schema.user.email,
			})
			.return()) as any[];

		expect(row).toBeDefined();
		expect(row.name).toBe("Upsert new");
		expect(row.email).toBe(email);
	});

	test("updates on conflict", async () => {
		const email = `upsert-conflict-${uid()}@test.com`;

		const [created] = (await userModel
			.upsert({
				insert: { name: "Original", email, age: 20 },
				update: { name: "Overwritten" },
				target: schema.user.email as any,
			})
			.return()) as any[];

		const [updated] = (await userModel
			.upsert({
				insert: { name: "Ignored insert", email, age: 20 },
				update: { name: "Overwritten" },
				target: schema.user.email as any,
			})
			.return()) as any[];

		expect(updated.id).toBe(created.id);
		expect(updated.name).toBe("Overwritten");
	});

	test("matches raw drizzle after upsert", async () => {
		const email = `upsert-verify-${uid()}@test.com`;

		await userModel
			.upsert({
				insert: { name: "Verify", email, age: 30 },
				update: { name: "Verified" },
				target: schema.user.email as any,
			})
			.return();

		const [expected] = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, email));

		expect((expected as any).name).toBe("Verify");
	});

	test("returnFirst — returns single object", async () => {
		const email = `upsert-first-${uid()}@test.com`;

		const row = (await userModel
			.upsert({
				insert: { name: "First upsert", email, age: 18 },
				update: { name: "Updated" },
				target: schema.user.email as any,
			})
			.returnFirst()) as any;

		expect(row).toBeDefined();
		expect(row.id).toBeNumber();
		expect(row.name).toBe("First upsert");
	});

	test("return > omit — removes specified fields", async () => {
		const email = `upsert-omit-${uid()}@test.com`;

		const [row] = await userModel
			.upsert({
				insert: { name: "Omit upsert", email, age: 40, secretField: 99 },
				update: { name: "Omit updated" },
				target: schema.user.email as any,
			})
			.return()
			.omit({ age: true, secretField: true });

		expect(row.age).toBeUndefined();
		expect(row.secretField).toBeUndefined();
		expect(row.name).toBe("Omit upsert");
	});

	test("returnFirst > safe — success", async () => {
		const email = `upsert-safe-${uid()}@test.com`;

		const result = await userModel
			.upsert({
				insert: { name: "Safe upsert", email, age: 22 },
				update: { name: "Safe updated" },
				target: schema.user.email as any,
			})
			.returnFirst()
			.safe();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect((result.data as any).name).toBe("Safe upsert");
	});
});
