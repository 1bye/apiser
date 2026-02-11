import z from "zod";

export { resolveZodSchemaMeta, resolveZodSchemaFromSources } from "./resolve-meta";
export type { FieldMeta, SchemaFieldsMeta } from "./resolve-meta";

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
