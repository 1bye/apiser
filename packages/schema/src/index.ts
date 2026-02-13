import { _z, resolveZodSchemaFromSources } from "@apiser/zod";
// import type * as _Type from "@apiser/typebox";
// import { Compile } from "@apiser/typebox/compile";
// import { resolveZodSchemaFromSources } from "@apiser/zod";
// import { TypeBoxFromZod } from "@sinclair/typemap";

export type IsZod<T> = T extends { def: any } ? true : false;
// export type IsTypebox<T> = T extends { type: string; } ? true : false;

export type ValidationType = "parse" | "safeParse";

export type Schema = any;

export type Infer<TSchema extends Schema> = _z.infer<TSchema>
// export type Infer<TSchema extends Schema> = IsZod<TSchema> extends true
//   ? _z.infer<TSchema>
//   : (IsTypebox<TSchema> extends true
//     ? _Type.Static<TSchema>
//     : never);

export type InferOr<TSchema extends Schema, TOr> = Infer<TSchema> extends Record<string, any>
  ? Infer<TSchema>
  : TOr;
export type InferUndefined<TSchema extends Schema | undefined> = TSchema extends undefined ? never : Infer<Exclude<TSchema, undefined>>

export type ExtractSchema<From extends Record<string, any> | undefined> = Exclude<From, undefined>["schema"];
export type ExtractSchemaFromKey<From extends Record<string, any> | undefined, Key extends string> = Exclude<From, undefined>[Key];

export interface CheckSchemaOptions {
  validationType?: ValidationType;
  sources?: Record<string, Record<string, unknown>>;
}

export function isZodSchema(schema: unknown): schema is { def: any } {
  return typeof schema === "object" && schema !== null && "def" in schema;
}

// export function isTypeboxSchema(schema: unknown): schema is { type: string; } {
//   return typeof schema === "object" && schema !== null && "type" in schema && typeof schema["type"] === "string";
// }

export function checkSchema<TSchema extends Schema>(schema: TSchema, input: unknown, options?: CheckSchemaOptions): unknown {
  const validationType = options?.validationType ?? "parse";

  let resolved = input;

  if (options?.sources && schema instanceof _z.ZodObject) {
    resolved = {
      ...(typeof input === "object" && input !== null ? input : {}),
      ...resolveZodSchemaFromSources(schema, options.sources),
    };
  }

  if (validationType === "parse") {
    return (schema.parse(resolved) ?? null) as Infer<TSchema>;
  } else if (validationType === "safeParse") {
    const { data } = schema.safeParse(resolved) as Infer<TSchema>;
    return data ?? null;
  }

  // let resolvedInput = input;
  // let T: _Type.TSchema = schema;

  // if (isZodSchema(schema)) {
  //   if (options?.sources && schema instanceof _z.ZodObject) {
  //     resolvedInput = {
  //       ...(typeof input === "object" && input !== null ? input : {}),
  //       ...resolveZodSchemaFromSources(schema, options.sources),
  //     };
  //   }

  //   T = TypeBoxFromZod(schema);
  // } else if (isTypeboxSchema(schema)) {
  //   T = schema;
  // } else {
  //   throw new Error("Schema is not Zod v4 or Typebox v1 schema!");
  // }

  // // TODO: once Elysia.js is uses Typebox v1 and `exact-mirror` as well supports Typebox v1, move to `exact-mirror` for faster compilation
  // const C = Compile(T);

  // if (options?.validationType === "safeParse") {
  //   try {
  //     return C.Parse(resolvedInput) as Infer<TSchema>;
  //   } catch (e) {
  //     return null;
  //   }
  // } else {
  //   return C.Parse(resolvedInput) as Infer<TSchema>;
  // };
}
