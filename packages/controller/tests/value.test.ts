import { describe, expect, test } from "bun:test";
import { z } from "@apisr/zod";
import { bindingInstanceSymbol, createHandler, createOptions } from "@/index";

describe("@apisr/controller", () => {
	describe("value binding", () => {
		test("binds primitive values directly", async () => {
			const options = createOptions({
				name: "value-controller",
				bindings: (bindings) => ({
					version: bindings.value(123),
				}),
			});

			const handler = createHandler(options);
			const main = handler(({ version }) => version, {
				payload: z.object({}),
				version: true,
			});

			const { data, error } = await main({});

			expect(error).toBeNull();
			expect(Number(data)).toBe(123);
		});

		test("binds string, boolean, number, bigint, and function values", async () => {
			const fn = () => "fn-result";
			const options = createOptions({
				name: "value-controller",
				bindings: (bindings) => ({
					valueString: bindings.value("hello"),
					valueBoolean: bindings.value(false),
					valueNumber: bindings.value(7),
					valueBigint: bindings.value(9007199254740993n),
					valueFn: bindings.value(fn),
				}),
			});

			const handler = createHandler(options);
			const main = handler(
				(ctx) => ({
					valueString: ctx.valueString,
					valueBoolean: ctx.valueBoolean,
					valueNumber: ctx.valueNumber,
					valueBigint: ctx.valueBigint,
					valueFn: ctx.valueFn,
				}),
				{
					payload: z.object({}),
					valueString: true,
					valueBoolean: true,
					valueNumber: true,
					valueBigint: true,
					valueFn: true,
				}
			);

			const { data, error } = await main({});

			expect(error).toBeNull();
			expect(String(data.valueString)).toBe("hello");
			expect(Boolean(data.valueBoolean)).toBe(false);
			expect(Number(data.valueNumber)).toBe(7);
			expect(String(data.valueBigint)).toBe("9007199254740993");
			expect((data.valueFn as () => string)()).toBe("fn-result");
		});

		test("binds object values without destructuring", async () => {
			const options = createOptions({
				name: "value-controller",
				bindings: (bindings) => ({
					config: bindings.value({
						foo: "bar",
						nested: {
							ok: true,
						},
					}),
				}),
			});

			const handler = createHandler(options);
			const main = handler(
				(ctx) => {
					return {
						hasFoo: "foo" in ctx,
						configFoo: ctx.config.foo,
						hasSymbol: bindingInstanceSymbol in ctx.config,
					};
				},
				{
					payload: z.object({}),
					config: true,
				}
			);

			const { data, error } = await main({});

			expect(error).toBeNull();
			expect(data).toEqual({
				hasFoo: false,
				configFoo: "bar",
				hasSymbol: true,
			});
		});
	});
});
