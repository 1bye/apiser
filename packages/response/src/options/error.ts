import type { Schema, Infer, ValidationType, InferOr, ExtractSchema } from "@apiser/schema";
import type { Headers } from "@/headers";
import type { DefaultError } from "@/error";
import type { PromiseOr } from "@/types";
import type { Options } from "@/options/base";

export namespace ErrorOptions {
  export interface Base<
    TSchema extends Schema = Schema,
  > {
    headers?: Headers<Infer<TSchema>>;
    schema?: TSchema;
    validationType?: ValidationType;

    mapError?: (ctx: {
      error: Error | null;
      meta: unknown;
      parsedError?: TSchema extends undefined ? DefaultError : Infer<TSchema>;
    }) => PromiseOr<TSchema extends undefined ? DefaultError : Infer<TSchema>>;

    mapDefaultError?: (error: DefaultError) => TSchema extends undefined ? DefaultError : Infer<TSchema>;

    onFailedSchemaValidation?: (ctx: {
      data: unknown;
    }) => PromiseOr<TSchema extends undefined ? DefaultError : Infer<TSchema>>
  }

  export type InferedSchemaFromBase<TError extends Base> = InferOr<ExtractSchema<TError>, DefaultError>;

  export type InferedSchema<TOptions extends Options> = (TOptions["error"] extends undefined
    ? DefaultError
    : InferOr<ExtractSchema<TOptions["error"]>, DefaultError>);
}

export function error<
  TSchema extends Schema
>(opts: ErrorOptions.Base<TSchema> & {
  schema?: TSchema;
}): ErrorOptions.Base<TSchema> & {
  schema?: TSchema;
} {
  return opts;
}
