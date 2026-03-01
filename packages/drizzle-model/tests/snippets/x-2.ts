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

await userModel
	.where({
		name: {
			like: "A%",
		},
	})
	.findFirst();

await userModel
	.where({
		name: esc.like("A%"),
	})
	.findFirst();
