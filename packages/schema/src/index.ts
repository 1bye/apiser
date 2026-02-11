import type { _z } from "@apiser/zod";
import { checkSchema as _checkSchema } from "@apiser/zod";

export type ValidationType = "parse" | "safeParse";

export type Schema = any;
export type Infer<TSchema extends Schema> = _z.infer<TSchema>;
export type InferOr<TSchema extends Schema, TOr> = Infer<TSchema> extends Record<string, any>
  ? Infer<TSchema>
  : TOr;
export type InferUndefined<TSchema extends Schema | undefined> = TSchema extends undefined ? never : Infer<TSchema>

export type ExtractSchema<From extends Record<string, any> | undefined> = Exclude<From, undefined>["schema"];
export type ExtractSchemaFromKey<From extends Record<string, any> | undefined, Key extends string> = Exclude<From, undefined>[Key];

export interface CheckSchemaOptions {
  validationType?: ValidationType;
  sources?: Record<string, Record<string, unknown>>;
}

export function checkSchema(schema: Schema, input: unknown, options?: CheckSchemaOptions) {
  return _checkSchema(schema, input, options);
  // const validationType = options?.validationType ?? "parse";

  // if (validationType === "parse") {
  //   return schema.parse(input);
  // } else if (validationType === "safeParse") {
  //   const { data } = schema.safeParse(input);

  //   return data;
  // }
}
