import { test } from "bun:test";

const jsonSymbol = Symbol("_json");

test("json symbol stringify", () => {
	const obj = {
		id: 123,
		[jsonSymbol]: () => new Response(),
	};

	const str = JSON.stringify(obj, null, 2);

	console.log(str);
});
