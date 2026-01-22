import type { DefaultMeta } from "@/response/meta";
import type { FunctionObject } from "@/types";
import type { ExtractSchema, Infer, InferOr, Schema, ValidationType } from "@apiser/schema";
import type { Options } from "./base";

export namespace MetaOptions {
  export interface Base<TSchema extends Schema = Schema> {
    schema?: TSchema;

    default?: FunctionObject<Infer<TSchema>, never>;
    validationType?: ValidationType;
  }

  export type InferedSchema<TOptions extends Options> = (TOptions["meta"] extends undefined
    ? DefaultMeta
    : InferOr<ExtractSchema<TOptions["meta"]>, DefaultMeta>);
}

export function meta<
  TSchema extends Schema
>(opts: MetaOptions.Base<TSchema> & {
  schema?: TSchema;
}): MetaOptions.Base<TSchema> & {
  schema?: TSchema;
} {
  return opts;
}
