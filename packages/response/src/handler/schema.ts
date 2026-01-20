import type z from "zod";

export type Schema = any;
export type Infer<TSchema extends Schema> = z.infer<TSchema>;
export type InferOr<TSchema extends Schema, TOr> = Infer<TSchema> extends Record<string, any>
  ? Infer<TSchema>
  : TOr;

export type ExtractSchema<From extends Record<string, any> | undefined> = Exclude<From, undefined>["schema"];
