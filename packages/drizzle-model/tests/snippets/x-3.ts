import { esc, modelBuilder } from "src/model";
import { db } from "../db";
import { relations } from "../relations";
import * as schema from "../schema";

const model = modelBuilder({
	schema,
	db,
	relations,
	dialect: "PostgreSQL",
});

// create model
const userModel = model("user", {});

// #1 syntax
await userModel
	.where({
		name: {
			like: "A%",
		},
	})
	.findFirst();

// #2 syntax
await userModel
	.where({
		name: esc.like("A%"),
	})
	.findFirst();

await orderModel
	.where({
		userId: esc(currentUserId),
		status: esc.in(["shipped", "delivered"]),
	})
	.findMany()
	.with({
		shippingAddress: true,
		items: {
			product: {
				category: true,
				images: imagesModel
					.where({
						isPrimary: true,
					})
					.limit(1),
				reviews: reviewsModel
					.where({
						rating: esc.gte(4),
					})
					.orderBy()
					.include({
						author: authorModel.select({
							name: true,
							avatar: true,
						}),
					}),
			},
		},
	});
