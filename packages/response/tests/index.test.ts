import { describe, expect, test } from "bun:test";
import { z } from "@apisr/zod";
import { createResponseHandler } from "@/index";

type TestErrorOutput = {
	name: string;
	details: string;
};

describe("@apisr/response ResponseHandler", () => {
	test("json() validates output schema, sets content-type and merges headers", () => {
		const handler = createResponseHandler((options) => ({
			json: options.json({
				schema: z.object({
					msg: z.string(),
				}),
				mapData: (input) => ({
					msg: input?.msg,
				}),
				headers: (data) => ({
					"x-data": data?.msg,
				}),
			}),
		}));

		const res = handler.json({ msg: "hello" }, { headers: { "x-opt": "1" } });

		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("application/json");
		expect(res.headers.get("x-opt")).toBe("1");
		expect(res.headers.get("x-data")).toBe("hello");
	});

	test("text() returns Response with provided body and init options", async () => {
		const handler = createResponseHandler({});
		const res = handler.text("ok", { status: 201, headers: { "x-t": "1" } });

		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(201);
		expect(res.headers.get("x-t")).toBe("1");
		expect(await res.text()).toBe("ok");
	});

	test("binary() applies onData, merges headers and returns Response", async () => {
		const handler = createResponseHandler({
			binary: {
				mapData: (data) => data,
				headers: () => ({
					"content-type": "application/octet-stream",
					"x-bin": "1",
				}),
			},
		});

		const body = new Uint8Array([1, 2, 3]);
		const res = handler.binary(body, {
			status: 202,
			headers: { "x-opt": "1" },
		});

		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(202);
		expect(res.headers.get("x-opt")).toBe("1");
		expect(res.headers.get("x-bin")).toBe("1");
		expect(res.headers.get("content-type")).toBe("application/octet-stream");

		const ab = await res.arrayBuffer();
		expect(new Uint8Array(ab)).toEqual(body);
	});

	test("withMeta() validates meta and fail() includes prepared meta", () => {
		const handler = createResponseHandler({
			meta: {
				schema: z.object({
					raw: z.boolean(),
					version: z.number().optional(),
				}),
				default: { raw: false },
			},
			error: {
				schema: z.object({
					name: z.string(),
					details: z.string(),
				}),
			},
		})
			.defineError("E_META", ({ meta }) => ({
				name: "E_META",
				details: String(meta.raw),
			}))
			.withMeta({ raw: true });

		const err = handler.fail("E_META");
		const output = err.output as TestErrorOutput;

		expect(err.name).toBe("E_META");
		expect(err.meta.raw).toBe(true);
		expect(output.name).toBe("E_META");
		expect(output.details).toBe("true");
	});

	test("defineError() supports static handler and fail() returns its output", () => {
		const handler = createResponseHandler({
			error: {
				schema: z.object({
					name: z.string(),
					details: z.string(),
				}),
			},
		}).defineError("STATIC", { name: "STATIC", details: "d" });

		const err = handler.fail("STATIC");
		const output = err.output as TestErrorOutput;
		expect(err.name).toBe("STATIC");
		expect(output).toEqual({ name: "STATIC", details: "d" });
	});

	test("fail() validates error input schema", () => {
		const handler = createResponseHandler({
			error: {
				schema: z.object({
					name: z.string(),
					details: z.string(),
				}),
			},
		}).defineError(
			"E_INPUT",
			({ input }) => ({
				name: "E_INPUT",
				details: String(input?.raw2),
			}),
			{
				input: z.object({
					raw2: z.boolean(),
				}),
			}
		);

		const err = handler.fail("E_INPUT", { raw2: true });
		const output = err.output as unknown as TestErrorOutput;
		expect(output.details).toBe("true");

		expect(() => handler.fail("E_INPUT", { raw2: "nope" } as any)).toThrow();
	});

	test("defineError() supports dynamic handler and fail() returns its output", () => {
		const handler = createResponseHandler({
			error: {
				schema: z.object({
					name: z.string(),
					details: z.string(),
				}),
			},
		}).defineError(
			"DYNAMIC",
			({ input, meta }) => {
				return {
					name: "DYNAMIC",
					details: String(input.raw2),
				};
			},
			{
				input: z.object({
					raw2: z.boolean(),
				}),
			}
		);

		const err = handler.fail("DYNAMIC", { raw2: true });
		const output = err.output as unknown as TestErrorOutput;
		expect(err.name).toBe("DYNAMIC");
		expect(output.details).toBe("true");
	});

	test("withMeta() affects meta for subsequent fail() calls", () => {
		const handler = createResponseHandler({
			meta: {
				schema: z.object({
					raw: z.boolean(),
				}),
				default: { raw: false },
			},
			error: {
				schema: z.object({
					name: z.string(),
					details: z.string(),
				}),
			},
		})
			.defineError("META", ({ meta }) => {
				return {
					name: "META",
					details: String(meta.raw),
				};
			})
			.withMeta({ raw: true });

		const err = handler.fail("META");
		const output = err.output as TestErrorOutput;
		expect(err.name).toBe("META");
		expect(output.details).toBe("true");
	});
});
