import { describe, expect, test } from "bun:test";
import { logger, model } from "tests/base";

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
	describe("insert", () => {
		test("base", async () => {
			await userModel.insert({
				email: `${Math.random()}random@email.com`,
				name: "Insert BASE",
				age: 123,
				invitedBy: 0,
				isVerified: true,
				secretField: 123,
			});
		});

		test("return", async () => {
			const users = await userModel
				.insert({
					email: `${Math.random()}random@email.com`,
					name: "Insert BASE",
					age: 123,
					invitedBy: 0,
					isVerified: true,
					secretField: 123,
				})
				.return();

			logger.info("insert -> return", users);

			for (const user of users) {
				expect(user.id).toBeDefined();
			}
		});

		test.skip("returnFirst", async () => {
			const user = await userModel
				.insert({
					email: `${Math.random()}random@email.com`,
					name: "Insert BASE",
					age: 123,
					invitedBy: 0,
					isVerified: true,
					secretField: 123,
				})
				.returnFirst();

			logger.info("insert -> returnFirst", user);

			expect(user.id).toBeDefined();
		});

		test.skip("return > omit", async () => {
			const users = await userModel
				.insert({
					email: `${Math.random()}random@email.com`,
					name: "Insert BASE",
					age: 123,
					invitedBy: 0,
					isVerified: true,
					secretField: 123,
				})
				.return()
				.omit({
					age: true,
					secretField: true,
					invitedBy: true,
				});

			logger.info("insert -> return -> omit", users);

			for (const user of users) {
				// @ts-expect-error
				expect(user.age).toBeUndefined();
			}
		});

		test.skip("returnFirst > omit", async () => {
			const user = await userModel
				.insert({
					email: `${Math.random()}random@email.com`,
					name: "Insert BASE",
					age: 123,
					invitedBy: 0,
					isVerified: true,
					secretField: 123,
				})
				.returnFirst()
				.omit({
					age: true,
					secretField: true,
					invitedBy: true,
				});

			logger.info("insert -> return -> omit", user);

			// @ts-expect-error
			expect(user.age).toBeUndefined();
		});

		test.skip("return > safe", async () => {
			const { data: user, error } = await userModel
				.insert({
					email: `${Math.random()}random@email.com`,
					name: "Insert BASE",
					age: 123,
					invitedBy: 0,
					isVerified: true,
					secretField: 123,
				})
				.returnFirst()
				.safe();

			if (error) {
				throw error;
			}

			logger.info("insert -> return -> safe", user);

			expect(user.age).toBeDefined();
		});
	});
});
