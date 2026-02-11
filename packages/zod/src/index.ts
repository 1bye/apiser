import z from "zod";

import { resolveZodSchemaFromSources, resolveZodSchemaMeta } from "./resolve-meta";

export { resolveZodSchemaMeta, resolveZodSchemaFromSources };
export type { FieldMeta, SchemaFieldsMeta } from "./resolve-meta";

export type ValidationType = "parse" | "safeParse";

export interface CheckSchemaOptions {
  validationType?: ValidationType;
  sources?: Record<string, Record<string, unknown>>;
}

export function checkSchema(schema: z.ZodType, input: unknown, options?: CheckSchemaOptions) {
  const validationType = options?.validationType ?? "parse";

  let resolved = input;

  if (options?.sources && schema instanceof z.ZodObject) {
    resolved = {
      ...(typeof input === "object" && input !== null ? input : {}),
      ...resolveZodSchemaFromSources(schema, options.sources),
    };
  }

  if (validationType === "parse") {
    return schema.parse(resolved);
  } else if (validationType === "safeParse") {
    const { data } = schema.safeParse(resolved);
    return data;
  }
}

export type FromKey = "query" | "params" | "body" | "headers";
export interface FromOptions {
  key: string | string[];
}
export type FromResult = ReturnType<(typeof z)["meta"]>;

export type ExtendResult = (typeof z) & {
  from(from: FromKey, options?: FromOptions): FromResult;
};

export function extendZod(zod: typeof z): ExtendResult {
  if (typeof zod.ZodType.prototype.from !== "undefined") {
    // This zod instance is already extended with the required methods,
    // doing it again will just result in multiple wrapper methods
    return zod as ExtendResult;
  }

  zod.ZodType.prototype.from = function (
    from: FromKey,
    options?: FromOptions
  ): FromResult {
    return this.meta({
      from,
      ...(options ?? {})
    });
  };

  return zod as ExtendResult;
}

const zod = extendZod(z);

export {
  zod,
  zod as z
};

export default zod;
