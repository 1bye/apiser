export * from "./base";
export * from "./binary";
export * from "./error";
export * from "./json";
export * from "./meta";

import { binary } from "./binary";
import { error } from "./error";
import { json } from "./json";
import { meta } from "./meta";

export const options = {
	json,
	meta,
	error,
	binary,
};
