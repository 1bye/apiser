import type z from "zod";

export type ValidationType = "parse" | "safeParse";

export type Schema = any;
export type Infer<TSchema extends Schema> = z.infer<TSchema>;
export type InferOr<TSchema extends Schema, TOr> = Infer<TSchema> extends Record<string, any>
  ? Infer<TSchema>
  : TOr;

export type ExtractSchema<From extends Record<string, any> | undefined> = Exclude<From, undefined>["schema"];
export type ExtractSchemaFromKey<From extends Record<string, any> | undefined, Key extends string> = Exclude<From, undefined>[Key];

export interface CheckSchemaOptions {
  validationType?: ValidationType;
}

export function checkSchema(schema: Schema, input: unknown, options?: CheckSchemaOptions) {
  const validationType = options?.validationType ?? "parse";

  if (validationType === "parse") {
    return schema.parse(input);
  } else if (validationType === "safeParse") {
    const { data } = schema.safeParse(input);

    return data;
  }
}
