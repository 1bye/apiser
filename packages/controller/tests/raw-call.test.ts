import { describe, expect, test } from "bun:test";
import { createResponseHandler } from "@apisr/response";
import { z } from "@apisr/zod";
import { createHandler, createOptions } from "@/index";

type RawResponseBody = {
	success: boolean;
	data: unknown;
	error: {
		name?: string;
	} | null;
};

const responseHandler = createResponseHandler({}).defineError("custom", {
	details: "Custom error occured",
	name: "custom",
});

const options = createOptions({
	name: "user-controller",
	responseHandler,
});

const handler = createHandler(options);

describe("@apisr/controller", () => {
	describe("raw call check", () => {
		test("handler return data via main.raw()", async () => {
			const main = handler(
				({ payload }) => {
					return payload.name;
				},
				{
					payload: z.object({
						name: z.string().from("body"),
					}),
				}
			);

			const response = await main.raw({
				request: {
					url: "/users",
					query: {},
					headers: {},
					params: {},
					body: JSON.stringify({ name: "Hello World" }),
				},
			});

			const body = (await response.json()) as RawResponseBody;

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.data).toBe("Hello World");
			expect(body.error).toBeNull();
		});

		test("handler return custom error via main.raw()", async () => {
			const main = handler(
				({ fail }) => {
					throw fail("custom");
				},
				{
					payload: z.object({
						name: z.string().from("body"),
					}),
				}
			);

			const response = await main.raw({
				request: {
					url: "/users",
					query: {},
					headers: {},
					params: {},
					body: JSON.stringify({ name: "Hello World" }),
				},
			});

			const body = (await response.json()) as RawResponseBody;

			expect(response.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.data).toBeNull();
			expect(body.error).toBeDefined();
			expect(body.error?.name).toBe("custom");
		});

		test("handler fail payload validation via main.raw()", async () => {
			const main = handler(
				({ payload }) => {
					return payload.age;
				},
				{
					payload: z.object({
						age: z.number().max(3).from("body"),
					}),
				}
			);

			const response = await main.raw({
				request: {
					url: "/users",
					query: {},
					headers: {},
					params: {},
					body: JSON.stringify({ age: 4 }),
				},
			});

			const body = (await response.json()) as RawResponseBody;

			expect(response.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.data).toBeNull();
			expect(body.error).toBeDefined();
		});
	});
});
