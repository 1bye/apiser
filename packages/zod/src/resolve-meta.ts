import z from "zod";

export interface FieldMeta {
	from: string;
	key?: string | string[];
}

export type SchemaFieldsMeta = Record<string, FieldMeta>;

/**
 * Extracts `from` metadata from each field of a zod object schema.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().from("body"),
 *   id: z.string().from("params"),
 *   token: z.string().from("headers", { key: "authorization" }),
 * });
 *
 * resolveZodSchemaMeta(schema);
 * // => {
 * //   name:  { from: "body" },
 * //   id:    { from: "params" },
 * //   token: { from: "headers", key: "authorization" },
 * // }
 * ```
 */
export function resolveZodSchemaMeta(
	schema: z.ZodObject<any>
): SchemaFieldsMeta {
	const shape = schema._zod.def.shape;
	const result: SchemaFieldsMeta = {};

	for (const fieldName in shape) {
		const fieldSchema = shape[fieldName];
		const meta = resolveFieldMeta(fieldSchema);

		if (meta) {
			result[fieldName] = meta;
		}
	}

	return result;
}

function resolveFieldMeta(schema: z.ZodType): FieldMeta | undefined {
	const meta = z.globalRegistry.get(schema) as
		| Record<string, unknown>
		| undefined;

	if (meta && typeof meta.from === "string") {
		const key = meta.key ?? meta.fromKey;

		return {
			from: meta.from,
			...(key !== undefined ? { key: key as string | string[] } : {}),
		};
	}

	// Unwrap wrapper types (optional, nullable, default, etc.)
	const def = (schema as any)._zod?.def;
	if (def?.innerType) {
		return resolveFieldMeta(def.innerType);
	}

	return undefined;
}

/**
 * Resolves field values from dynamic sources based on the schema's `from` metadata.
 *
 * Sources is a map where keys match possible `from` values
 * (e.g. `"query"`, `"params"`, `"body"`, `"headers"`, `"handler.payload"`)
 * and values are the corresponding data objects.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().from("body"),
 *   id: z.string().from("params"),
 *   search: z.string().from("query"),
 *   auth: z.string().from("headers", { key: "authorization" }),
 *   prev: z.string().from("handler.payload", { key: "name" }),
 * });
 *
 * const resolved = resolveZodSchemaFromSources(schema, {
 *   body:   { name: "John" },
 *   params: { id: "42" },
 *   query:  { search: "test" },
 *   headers: { authorization: "Bearer ..." },
 *   "handler.payload": { name: "prev-value" },
 * });
 * // => { name: "John", id: "42", search: "test", auth: "Bearer ...", prev: "prev-value" }
 * ```
 */
export function resolveZodSchemaFromSources(
	schema: z.ZodObject<any>,
	sources: Record<string, Record<string, unknown>>
): Record<string, unknown> {
	const fieldsMeta = resolveZodSchemaMeta(schema);
	const result: Record<string, unknown> = {};

	for (const [fieldName, meta] of Object.entries(fieldsMeta)) {
		const source = sources[meta.from];
		if (!source) {
			continue;
		}

		const keys = meta.key
			? Array.isArray(meta.key)
				? meta.key
				: [meta.key]
			: [fieldName];

		for (const k of keys) {
			const value = getNestedValue(source, k);
			if (value !== undefined) {
				result[fieldName] = value;
				break;
			}
		}
	}

	return result;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = obj;

	for (const part of parts) {
		if (
			current === null ||
			current === undefined ||
			typeof current !== "object"
		) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}
