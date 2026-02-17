import { describe, expect, test } from "bun:test";
import { createResponseHandler } from "@apisr/response";
import { z } from "@apisr/zod";
import { createHandler, createOptions } from "@/index";

const responseHandler = createResponseHandler((options) => ({
	json: options.json({
		schema: z.object({
			data: z.any(),
			type: z.string(),
		}),
	}),
})).defineError("custom", {
	details: "Custom error occured",
	name: "custom",
});

const options = createOptions({
	name: "user-controller",
	responseHandler,
	bindings: (bindings) => ({}),
});

const handler = createHandler(options);

describe("@apisr/controller", () => {
	describe("Request check", () => {
		test("handler return data", async () => {
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

			const { data, error } = await main.call(
				{
					request: {
						body: { name: "Hello World" },
					},
				},
				{ name: "HELLO WORLD" }
			);

			console.log({
				data,
				error,
			});

			expect(data).toBe("Hello World");
			expect(error).toBeNull();
		});
	});
});
