import { describe, expect, test } from "bun:test";
import { resolveZodSchemaFromSources, resolveZodSchemaMeta, z } from "@/index";

describe("resolveZodSchemaMeta", () => {
	test("extracts from metadata from fields", () => {
		const schema = z.object({
			name: z.string().from("body"),
			id: z.string().from("params"),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			name: { from: "body" },
			id: { from: "params" },
		});
	});

	test("extracts key option", () => {
		const schema = z.object({
			token: z.string().from("headers", { key: "authorization" }),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			token: { from: "headers", key: "authorization" },
		});
	});

	test("extracts array key option for fallback", () => {
		const schema = z.object({
			name: z.string().from("body", { key: ["name2", "name3"] }),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			name: { from: "body", key: ["name2", "name3"] },
		});
	});

	test("skips fields without from metadata", () => {
		const schema = z.object({
			name: z.string().from("body"),
			age: z.number(),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			name: { from: "body" },
		});
		expect(meta.age).toBeUndefined();
	});

	test("handles handler.payload source", () => {
		const schema = z.object({
			prev: z.string().from("handler.payload"),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			prev: { from: "handler.payload" },
		});
	});

	test("handles all source types", () => {
		const schema = z.object({
			a: z.string().from("query"),
			b: z.string().from("params"),
			c: z.string().from("body"),
			d: z.string().from("headers"),
			e: z.string().from("handler.payload"),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta.a?.from).toBe("query");
		expect(meta.b?.from).toBe("params");
		expect(meta.c?.from).toBe("body");
		expect(meta.d?.from).toBe("headers");
		expect(meta.e?.from).toBe("handler.payload");
	});

	test("returns empty map for schema with no from metadata", () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({});
	});

	test("handles optional fields with from metadata", () => {
		const schema = z.object({
			name: z.string().from("body").optional(),
		});

		const meta = resolveZodSchemaMeta(schema);

		expect(meta).toEqual({
			name: { from: "body" },
		});
	});
});

describe("resolveZodSchemaFromSources", () => {
	test("resolves values from matching sources", () => {
		const schema = z.object({
			name: z.string().from("body"),
			id: z.string().from("params"),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { name: "John" },
			params: { id: "42" },
		});

		expect(result).toEqual({
			name: "John",
			id: "42",
		});
	});

	test("resolves from all source types", () => {
		const schema = z.object({
			search: z.string().from("query"),
			id: z.string().from("params"),
			name: z.string().from("body"),
			auth: z.string().from("headers", { key: "authorization" }),
			prev: z.string().from("handler.payload", { key: "name" }),
		});

		const result = resolveZodSchemaFromSources(schema, {
			query: { search: "test" },
			params: { id: "42" },
			body: { name: "John" },
			headers: { authorization: "Bearer token" },
			"handler.payload": { name: "prev-value" },
		});

		expect(result).toEqual({
			search: "test",
			id: "42",
			name: "John",
			auth: "Bearer token",
			prev: "prev-value",
		});
	});

	test("uses key option to pick from alternate field name", () => {
		const schema = z.object({
			token: z.string().from("headers", { key: "authorization" }),
		});

		const result = resolveZodSchemaFromSources(schema, {
			headers: { authorization: "Bearer abc" },
		});

		expect(result).toEqual({
			token: "Bearer abc",
		});
	});

	test("uses array key with fallback", () => {
		const schema = z.object({
			name: z.string().from("body", { key: ["displayName", "name"] }),
		});

		// first key missing, falls back to second
		const result = resolveZodSchemaFromSources(schema, {
			body: { name: "John" },
		});

		expect(result).toEqual({
			name: "John",
		});
	});

	test("uses first available key from array", () => {
		const schema = z.object({
			name: z.string().from("body", { key: ["displayName", "name"] }),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { displayName: "Johnny", name: "John" },
		});

		expect(result).toEqual({
			name: "Johnny",
		});
	});

	test("skips fields when source is not provided", () => {
		const schema = z.object({
			name: z.string().from("body"),
			id: z.string().from("params"),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { name: "John" },
			// params not provided
		});

		expect(result).toEqual({
			name: "John",
		});
		expect(result.id).toBeUndefined();
	});

	test("skips fields when value is not found in source", () => {
		const schema = z.object({
			name: z.string().from("body"),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { other: "value" },
		});

		expect(result).toEqual({});
	});

	test("resolves nested values via dot notation key", () => {
		const schema = z.object({
			name: z.string().from("body", { key: "customer.name" }),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { customer: { name: "John" } },
		});

		expect(result).toEqual({
			name: "John",
		});
	});

	test("returns undefined for broken nested path", () => {
		const schema = z.object({
			name: z.string().from("body", { key: "customer.name" }),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { customer: null },
		});

		expect(result).toEqual({});
	});

	test("returns empty object when no from metadata exists", () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const result = resolveZodSchemaFromSources(schema, {
			body: { name: "John", age: 30 },
		});

		expect(result).toEqual({});
	});
});
