import { describe, expect, test } from "bun:test";
import { model } from "tests/base";
import { esc } from "@/model";

const userModel = model("user", {});

function uid(): string {
	return `${Date.now()}-${Math.random()}`;
}

describe("safe", () => {
	describe("query — safe()", () => {
		test("findFirst — success returns { data, error: undefined }", async () => {
			const result = await userModel.findFirst().safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			expect((result.data as any).id).toBeNumber();
		});

		test("findMany — success returns { data, error: undefined }", async () => {
			const result = await userModel.findMany().safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeArray();
		});

		test("findFirst with where — success", async () => {
			const result = await userModel
				.where({ name: esc("Alex") })
				.findFirst()
				.safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
		});
	});

	describe("mutation — safe()", () => {
		test("insert > returnFirst > safe — success", async () => {
			const result = await userModel
				.insert({
					email: `${uid()}@safe.com`,
					name: "Safe insert",
					age: 25,
				})
				.returnFirst()
				.safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			expect((result.data as any).name).toBe("Safe insert");
		});

		test("insert > return > safe — success", async () => {
			const result = await userModel
				.insert({
					email: `${uid()}@safe.com`,
					name: "Safe array insert",
					age: 30,
				})
				.return()
				.safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
		});

		test("insert > safe — error on duplicate email", async () => {
			const email = `${uid()}@safe-dup.com`;

			await userModel.insert({
				email,
				name: "First",
				age: 20,
			});

			const result = await userModel
				.insert({
					email,
					name: "Duplicate",
					age: 20,
				})
				.returnFirst()
				.safe();

			expect(result.error).toBeDefined();
			expect(result.data).toBeUndefined();
		});
	});
});
