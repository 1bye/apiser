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

const user = await userModel
	.where({
		age: esc(12),
	})
	.findFirst();

console.log(user);
