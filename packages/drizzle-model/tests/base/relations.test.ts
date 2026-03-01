import { beforeAll, describe, expect, test } from "bun:test";
import { model } from "tests/base";
import { db } from "tests/db";
import { esc } from "@/model";

const userModel = model("user", {});
const postModel = model("userPosts", {});
const commentModel = model("postComments", {});
const ideaModel = model("userIdeas", {});

function uid(): string {
	return `${Date.now()}-${Math.random()}`;
}

describe("relations", () => {
	let testUserId: number;
	let testPostId: number;
	let testCommentId: number;
	let inviteeUserId: number;

	beforeAll(async () => {
		const user = await userModel
			.insert({
				name: "Relation Test User",
				email: `${uid()}@relations.com`,
				age: 25,
			})
			.returnFirst();
		testUserId = user.id;

		const invitee = await userModel
			.insert({
				name: "Invitee User",
				email: `${uid()}@relations.com`,
				age: 22,
				invitedBy: testUserId,
			})
			.returnFirst();
		inviteeUserId = invitee.id;

		const post = await postModel
			.insert({
				title: "Test Post for Relations",
				description: "Testing relations",
				userId: testUserId,
			})
			.returnFirst();
		testPostId = post.id;

		const comment = await commentModel
			.insert({
				content: "Test comment",
				authorId: testUserId,
				postId: testPostId,
			})
			.returnFirst();
		testCommentId = comment.id;

		await ideaModel.insert({
			content: "Test idea",
			userId: testUserId,
		});
	});

	// -----------------------------------------------------------------------
	// Basic .with() - loading relations
	// -----------------------------------------------------------------------

	describe(".with() - basic relation loading", () => {
		test("loads one-to-many relation (posts)", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			expect(user.posts.length).toBeGreaterThan(0);
			expect(user.posts[0]?.title).toBeDefined();
		});

		test("loads many-to-one relation (user from post)", async () => {
			const posts = await postModel
				.where({ id: esc(testPostId) })
				.findMany()
				.with({ user: true });

			expect(posts).toBeArray();
			const post = posts[0]!;
			expect(post).toBeDefined();
			expect(post.user).toBeDefined();
			expect(post.user.name).toBe("Relation Test User");
		});

		test("loads self-referencing relation (invitee)", async () => {
			const users = await userModel
				.where({ id: esc(inviteeUserId) })
				.findMany()
				.with({ invitee: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.invitee).toBeDefined();
			expect(user.invitee?.id).toBe(testUserId);
		});
	});

	// -----------------------------------------------------------------------
	// Nested relations
	// -----------------------------------------------------------------------

	describe(".with() - nested relations", () => {
		test("loads nested relations (user -> posts -> comments)", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: {
						comments: true,
					},
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			const post = user.posts[0]!;
			expect(post).toBeDefined();
			expect(post.comments).toBeArray();
			expect(post.comments.length).toBeGreaterThan(0);
		});

		test("loads deeply nested relations (post -> comments -> author)", async () => {
			const posts = await postModel
				.where({ id: esc(testPostId) })
				.findMany()
				.with({
					comments: {
						author: true,
					},
				});

			expect(posts).toBeArray();
			const post = posts[0]!;
			expect(post).toBeDefined();
			expect(post.comments).toBeArray();
			const comment = post.comments[0]!;
			expect(comment).toBeDefined();
			expect(comment.author).toBeDefined();
			expect(comment.author.name).toBe("Relation Test User");
		});
	});

	// -----------------------------------------------------------------------
	// Multiple relations
	// -----------------------------------------------------------------------

	describe(".with() - multiple relations", () => {
		test("loads multiple relations at once", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: true,
					invitee: true,
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			expect(user.invitee).toBeDefined();
		});

		test("loads multiple relations with nested relations", async () => {
			const posts = await postModel
				.where({ id: esc(testPostId) })
				.findMany()
				.with({
					user: true,
					comments: {
						author: true,
					},
				});

			expect(posts).toBeArray();
			const post = posts[0]!;
			expect(post).toBeDefined();
			expect(post.user).toBeDefined();
			expect(post.comments).toBeArray();
			const comment = post.comments[0]!;
			expect(comment).toBeDefined();
			expect(comment.author).toBeDefined();
		});
	});

	// -----------------------------------------------------------------------
	// Query where relations
	// -----------------------------------------------------------------------

	describe(".with() - filtered relations", () => {
		test("filters relation with where clause", async () => {
			await postModel.insert({
				title: "New Post Title",
				description: "Another post",
				userId: testUserId,
			});

			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: postModel.where({
						title: {
							like: "New%",
						},
					}),
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			for (const post of user.posts) {
				expect(post.title.startsWith("New")).toBe(true);
			}
		});

		test("filters nested relations", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: postModel.where({ likes: { gte: esc(0) } }).include({
						comments: true,
					}),
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
		});
	});

	// -----------------------------------------------------------------------
	// .include() for type-safe relation values
	// -----------------------------------------------------------------------

	describe(".include() - type-safe relation selection", () => {
		test("uses .include() to pass nested relations to .with()", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: postModel
						.where({
							title: {
								like: "%",
							},
						})
						.include({
							comments: true,
						}),
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			if (user.posts.length > 0) {
				const post = user.posts[0]!;
				expect(post).toBeDefined();
				expect(post.comments).toBeDefined();
			}
		});

		test("chains .include() with filtered relations", async () => {
			const posts = await postModel
				.where({ id: esc(testPostId) })
				.findMany()
				.with({
					comments: commentModel
						.where({ content: { like: "%test%" } })
						.include({
							author: true,
						}),
				});

			expect(posts).toBeArray();
			const post = posts[0]!;
			expect(post).toBeDefined();
			expect(post.comments).toBeArray();
		});
	});

	// -----------------------------------------------------------------------
	// Combining relations with select/exclude
	// -----------------------------------------------------------------------

	describe("relations with .select() and .exclude()", () => {
		test("combines .with() and .select()", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true })
				.select({ id: true, name: true });

			expect(users).toBeArray();
			const user = users[0] as (typeof users)[0] & { posts: unknown[] };
			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.name).toBeDefined();
			// @ts-expect-error
			expect(user.email).toBeUndefined();
			expect(user.posts).toBeArray();
		});

		test("combines .with() and .exclude()", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true })
				.exclude({ email: true, secretField: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.name).toBeDefined();
			// @ts-expect-error
			expect(user.email).toBeUndefined();
			// @ts-expect-error
			expect(user.secretField).toBeUndefined();
			expect(user.posts).toBeArray();
		});

		test("combines .with() and .exclude() removes specific columns", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true })
				.exclude({ email: true, age: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.name).toBeDefined();
			// @ts-expect-error
			expect(user.email).toBeUndefined();
			// @ts-expect-error
			expect(user.age).toBeUndefined();
			expect(user.posts).toBeArray();
		});
	});

	// -----------------------------------------------------------------------
	// Relations with findFirst
	// -----------------------------------------------------------------------

	describe("relations with .findFirst()", () => {
		test("loads relations with findFirst", async () => {
			const user = await userModel
				.where({ id: esc(testUserId) })
				.findFirst()
				.with({ posts: true });

			expect(user).toBeDefined();
			if (user) {
				expect(user.posts).toBeArray();
			}
		});

		test("loads nested relations with findFirst", async () => {
			const user = await userModel
				.where({ id: esc(testUserId) })
				.findFirst()
				.with({
					posts: {
						comments: true,
					},
				});

			expect(user).toBeDefined();
			if (user) {
				expect(user.posts).toBeArray();
				if (user.posts.length > 0) {
					const post = user.posts[0]!;
					expect(post).toBeDefined();
					expect(post.comments).toBeDefined();
				}
			}
		});
	});

	// -----------------------------------------------------------------------
	// Relations with .safe()
	// -----------------------------------------------------------------------

	describe("relations with .safe()", () => {
		test("wraps relation query in safe result", async () => {
			const result = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true })
				.safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			if (result.data) {
				expect(result.data).toBeArray();
				const user = result.data[0]!;
				expect(user).toBeDefined();
				expect(user.posts).toBeArray();
			}
		});

		test("safe with findFirst and relations", async () => {
			const result = await userModel
				.where({ id: esc(testUserId) })
				.findFirst()
				.with({ posts: true })
				.safe();

			expect(result.error).toBeUndefined();
			expect(result.data).toBeDefined();
			if (result.data) {
				expect(result.data.posts).toBeArray();
			}
		});
	});

	// -----------------------------------------------------------------------
	// Relations with .raw()
	// -----------------------------------------------------------------------

	describe("relations with .raw()", () => {
		test("skips format function with relations", async () => {
			const userModelWithFormat = model("user", {
				format({ secretField, ...rest }) {
					return rest;
				},
			});

			const users = await userModelWithFormat
				.where({ id: esc(testUserId) })
				.findMany()
				.with({ posts: true })
				.raw();

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.secretField).toBeDefined();
			expect(user.posts).toBeArray();
		});
	});

	// -----------------------------------------------------------------------
	// Edge cases
	// -----------------------------------------------------------------------

	describe("edge cases", () => {
		test("handles empty relation arrays", async () => {
			const newUser = await userModel
				.insert({
					name: "No Posts User",
					email: `${uid()}@relations.com`,
					age: 30,
				})
				.returnFirst();

			const users = await userModel
				.where({ id: esc(newUser.id) })
				.findMany()
				.with({ posts: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			expect(user.posts).toHaveLength(0);
		});

		test("handles null one-to-one relations", async () => {
			const newUser = await userModel
				.insert({
					name: "No Inviter User",
					email: `${uid()}@relations.com`,
					age: 28,
				})
				.returnFirst();

			const users = await userModel
				.where({ id: esc(newUser.id) })
				.findMany()
				.with({ invitee: true });

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.invitee).toBeNull();
		});

		test("loads multiple levels of nested relations", async () => {
			const users = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: {
						comments: {
							author: true,
						},
					},
				});

			expect(users).toBeArray();
			const user = users[0]!;
			expect(user).toBeDefined();
			expect(user.posts).toBeArray();
			if (user.posts.length > 0) {
				const post = user.posts[0]!;
				if (post && post.comments.length > 0) {
					const comment = post.comments[0]!;
					expect(comment).toBeDefined();
					expect(comment.author).toBeDefined();
				}
			}
		});
	});

	// -----------------------------------------------------------------------
	// Comparison with raw Drizzle queries
	// -----------------------------------------------------------------------

	describe("comparison with raw drizzle", () => {
		test("matches drizzle query.findFirst with relations", async () => {
			const modelResult = await userModel
				.where({ id: esc(testUserId) })
				.findFirst()
				.with({ posts: true });

			const drizzleAll = await db.query.user.findMany({
				with: {
					posts: true,
				},
			});
			const drizzleResult = drizzleAll.find((u) => u.id === testUserId);

			expect(modelResult).toBeDefined();
			expect(drizzleResult).toBeDefined();
			if (modelResult && drizzleResult) {
				expect(modelResult.id).toBe(drizzleResult.id);
				expect(modelResult.posts).toBeArray();
				expect(drizzleResult.posts).toBeArray();
			}
		});

		test("matches drizzle query.findMany with nested relations", async () => {
			const modelResult = await userModel
				.where({ id: esc(testUserId) })
				.findMany()
				.with({
					posts: {
						comments: true,
					},
				});

			const drizzleAll = await db.query.user.findMany({
				with: {
					posts: {
						with: {
							comments: true,
						},
					},
				},
			});
			const drizzleResult = drizzleAll.find((u) => u.id === testUserId);

			expect(modelResult.length).toBeGreaterThan(0);
			expect(drizzleResult).toBeDefined();
			if (modelResult.length > 0 && drizzleResult) {
				const modelUser = modelResult[0]!;
				expect(modelUser).toBeDefined();
				expect(modelUser.posts.length).toBe(drizzleResult.posts.length);
			}
		});
	});
});
