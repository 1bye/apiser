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

    onError?: (ctx: {
      error: Error;
      meta: unknown;
      parsedError?: TSchema extends undefined ? DefaultError : Infer<TSchema>;
    }) => PromiseOr<TSchema extends undefined ? DefaultError : Infer<TSchema>>;
  }

  export type InferedSchema<TOptions extends Options> = (TOptions["error"] extends undefined
    ? DefaultError
    : InferOr<ExtractSchema<TOptions["error"]>, DefaultError>);
}
