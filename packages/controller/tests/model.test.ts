import { describe, expect, test } from "bun:test";
import { modelBuilder } from "@apisr/drizzle-model";
import { z } from "@apisr/zod";
import { createHandler, createOptions } from "@/index";
import { db } from "./__internal/db";
import { relations } from "./__internal/relations";
import * as schema from "./__internal/schema";

const model = modelBuilder({
	db,
	schema,
	relations,
	dialect: "PostgreSQL",
});

const userModel = model("user", {});

const makeHandler = (bindingOptions: any = {}) => {
	const options = createOptions({
		name: "user-controller",
		bindings: (bindings) => ({
			userModel: bindings.model(userModel, bindingOptions),
		}),
	});

	return createHandler(options);
};

const emptyPayload = z.object({});

describe("@apisr/controller", () => {
	describe("model binding", () => {
		test("default binding uses params by model name", async () => {
			const handler = makeHandler();
			const main = handler(({ userModel }) => userModel.findMany(), {
				payload: emptyPayload,
				userModel: true,
			});

			const expected = await userModel.where({ id: { eq: 1 } }).findMany();
			const { data, error } = await main.call(
				{
					request: {
						params: {
							user: 1,
						},
					},
				},
				{}
			);

			const resolvedData = await data;
			expect(error).toBeNull();
			expect(resolvedData).toEqual(expected);
		});

		test("custom from/query extracts primary key", async () => {
			let capturedId: number | undefined;
			const handler = makeHandler({
				from: "query",
				fromKey: "userId",
				load: ({ id }: { id: number }) => {
					capturedId = id;
					return userModel;
				},
			});

			const main = handler(
				({ userModel }) => ({
					modelName: userModel.$modelName,
					capturedId,
				}),
				{
					payload: emptyPayload,
					userModel: true,
				}
			);

			const { data, error } = await main.call(
				{
					request: {
						query: {
							userId: 7,
						},
					},
				},
				{}
			);

			expect(error).toBeNull();
			expect(data).toEqual({
				modelName: "user",
				capturedId: 7,
			});
		});

		test("merges where clause with primary key", async () => {
			const handler = makeHandler({
				where: {
					isVerified: { eq: false },
				},
			});

			const main = handler(({ userModel }) => userModel.findMany(), {
				payload: emptyPayload,
				userModel: true,
			});

			const expected = await userModel
				.where({
					id: { eq: 1 },
					isVerified: { eq: false },
				})
				.findMany();

			const { data, error } = await main.call(
				{
					request: {
						params: {
							user: 1,
						},
					},
				},
				{}
			);

			const resolvedData = await data;
			expect(error).toBeNull();
			expect(resolvedData).toEqual(expected);
		});

		test("load + notFound returns error", async () => {
			const handler = makeHandler({
				from: "params",
				fromKey: "user",
				load: () => null,
				notFound: ({
					fail,
				}: {
					fail: (name: string, input?: unknown) => any;
				}) => {
					throw fail("notFound");
				},
			});

			const main = handler(({ userModel }) => userModel.findMany(), {
				payload: emptyPayload,
				userModel: true,
			});

			const { data, error } = await main.call(
				{
					request: {
						params: {
							user: 999,
						},
					},
				},
				{}
			);

			expect(data).toBeNull();
			expect(error).toBeDefined();
		});
	});
});
