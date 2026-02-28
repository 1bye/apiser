import { describe, expect, test } from "bun:test";
import { logger, model } from "tests/base";
import { esc } from "@/model";

const userModel = model("user", {});
const userModelFormat = model("user", {
	format({ secretField, isVerified, ...rest }) {
		return {
			...rest,
			isVerified: !!isVerified,
			customField: "Hello World" as const,
		};
	},
});

describe("@apisr/drizzl-model", () => {
	describe("findFirst", () => {
		test("base", async () => {
			const user = await userModel.findFirst();

			logger.info("findFirst -> base", user);

			expect(user.id).toBeDefined();
		});

		test("simple where", async () => {
			const user = await userModel
				.where({
					name: esc("Alex"),
				})
				.findFirst();

			logger.info("findFirst -> simple where", user);

			expect(user.id).toBeDefined();
		});

		test("simple where -> like", async () => {
			const user = await userModel
				.where({
					name: {
						like: "An%",
					},
				})
				.findFirst();

			logger.info("findFirst -> simple where -> like", user);

			expect(user.id).toBeDefined();
		});

		test("after query -> select", async () => {
			const user = await userModel.findFirst().select({
				name: true,
				age: true,
			});

			logger.info("findFirst -> after query -> select", user);

			expect(user.name).toBeDefined();
		});

		test("after query -> exclude", async () => {
			const user = await userModel.findFirst().exclude({
				name: true,
			});

			logger.info("findFirst -> after query -> exclude", user);

			// @ts-expect-error
			expect(user.name).toBeUndefined();
		});

		test("format", async () => {
			const user = await userModelFormat.findFirst();

			logger.info("findFirst -> format", user);

			// @ts-expect-error
			expect(user.secretField).toBeUndefined();
		});

		test("format -> raw", async () => {
			const user = await userModelFormat.findFirst().raw();

			logger.info("findFirst -> format -> raw", user);

			expect(user.secretField).toBeDefined();
		});

		test.skip("safe", async () => {
			const { data: user, error } = await userModelFormat.findFirst().safe();

			if (error) {
				throw error;
			}

			logger.info("findFirst -> safe", user);

			expect(user.name).toBeDefined();
		});
	});

	describe("findMany", () => {
		test("base", async () => {
			const users = await userModel.findMany();

			logger.info("findMany -> base", users);

			expect(users).toBeArray();

			for (const user of users) {
				expect(user.id).toBeDefined();
			}
		});

		test("simple where", async () => {
			const users = await userModel
				.where({
					name: esc("Alex"),
				})
				.findMany();

			logger.info("findMany -> simple where", users);

			for (const user of users) {
				expect(user.id).toBeDefined();
			}
		});

		test("simple where -> like", async () => {
			const users = await userModel
				.where({
					name: {
						like: "An%",
					},
				})
				.findMany();

			logger.info("findMany -> simple where -> like", users);

			for (const user of users) {
				expect(user.id).toBeDefined();
			}
		});

		test("after query -> select", async () => {
			const users = await userModel.findMany().select({
				name: true,
				age: true,
			});

			logger.info("findMany -> after query -> select", users);

			for (const user of users) {
				expect(user.name).toBeDefined();
			}
		});

		test("after query -> exclude", async () => {
			const users = await userModel.findMany().exclude({
				name: true,
			});

			logger.info("findFirst -> after query -> exclude", users);

			for (const user of users) {
				// @ts-expect-error
				expect(user.name).toBeUndefined();
			}
		});

		test("format", async () => {
			const users = await userModelFormat.findMany();

			logger.info("findFirst -> format", users);

			for (const user of users) {
				// @ts-expect-error
				expect(user.secretField).toBeUndefined();
			}
		});

		test("format -> raw", async () => {
			const users = await userModelFormat.findMany().raw();

			logger.info("findFirst -> format -> raw", users);

			for (const user of users) {
				expect(user.secretField).toBeDefined();
			}
		});

		test.skip("safe", async () => {
			const { data: users, error } = await userModelFormat.findMany().safe();

			if (error) {
				throw error;
			}

			logger.info("findFirst -> safe", users);

			for (const user of users) {
				expect(user.name).toBeDefined();
			}
		});
	});
});
