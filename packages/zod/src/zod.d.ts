declare module "zod" {
	interface GlobalMeta {
		from?: "query" | "params" | "body" | "headers" | "handler.payload";
		fromKey?: string | string[];
	}

	// Note: This should always perfectly match the zod type definition instead in terms of generics
	interface ZodType<
		out Output = unknown,
		out Input = unknown,
		out Internals extends core.$ZodTypeInternals<
			Output,
			Input
		> = core.$ZodTypeInternals<Output, Input>,
	> extends core.$ZodType<Output, Input, Internals> {
		/**
		 * Tells from where pickup value
		 *
		 * Basic example:
		 * ```ts
		 * const index = handler(() => "OK", {
		 *  payload: z.object({
		 *    name: z.string().from("body")
		 *  })
		 * })
		 * ```
		 *
		 * More extended example:
		 * ```ts
		 * const index = handler(() => "OK", {
		 *  payload: z.object({
		 *    name: z.string().from("body", {
		 *      key: "name2", // or using dot notation: "customer.name"
		 *      // OR
		 *      key: ["name2", "name3"] // in case if no `name2`, will fallback to `name3`
		 *    })
		 *  })
		 * })
		 * ```
		 */
		from<
			TFrom extends "query" | "params" | "body" | "headers" | "handler.payload",
			TKey extends string | string[] = string | string[],
		>(
			from: TFrom,
			options?: {
				key?: TKey;
			}
		): this & {
			$from: TFrom;
			$fromKey: TKey;
		};
	}
}

export {};
