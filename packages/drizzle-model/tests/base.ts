import { createLogger } from "@apisr/logger";
import { createConsole } from "@apisr/logger/console";
import { modelBuilder } from "../src";
import { db } from "./db";
import { relations } from "./relations";
import * as schema from "./schema";

export const model = modelBuilder({
	schema,
	db,
	relations,
	dialect: "PostgreSQL",
});

export const logger = createLogger({
	transports: {
		console: createConsole({
			mode: "pretty",
		}),
	},
});
