import { modelBuilder } from "../src";
import * as schema from "./schema";
import { db } from "./db";
import { relations } from "./relations";

const model = modelBuilder({
	schema,
	db,
	relations,
});

const userModel = model("user", {});
const postsModel = model("userPosts", {});

const testRaw1 = await userModel
	.age(123)
	.findOne()
	.with({
		// Fix is relations in here are from userModel not from posts
		posts: postsModel.id(123),
	});

testRaw1.posts;

const testRaw2 = await userModel
	.age(123)
	.findOne()
	.with({
		posts: true,
	})
	.select({
		age: true,
		email: true,
		posts: {
			id: true,
		},
	});

// testRaw2.posts[0]?.id

const testRaw3 = await userModel.age(123).findOne().with({
	invitee: true,
});

const testRaw4 = await postsModel.id(1).findOne().with({
	user: true,
});

// testRaw4.user.
