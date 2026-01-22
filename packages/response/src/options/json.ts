import type { ExtractSchemaFromKey, Infer, InferOr, Schema, ValidationType } from "@apiser/schema";
import type { Headers } from "@/headers";
import type { PromiseOr } from "@/types";
import type { Options } from "./base";
import type { JsonResponse } from "@/response/json";

export namespace JsonOptions {
  export interface Base<TInputSchema extends Schema = Schema, TOutputSchema extends Schema = Schema> {
    headers?: Headers<{
      input: Infer<TInputSchema>,
      output: Infer<TOutputSchema>
    }>;

    inputSchema?: TInputSchema;
    outputSchema?: TOutputSchema;

    validationType?: ValidationType;

    onData?: (data: Infer<TInputSchema>) => PromiseOr<Infer<TOutputSchema>>;
  }

  export type InferedInputSchema<TOptions extends Options> = (TOptions["json"] extends undefined
    ? JsonResponse.DefaultInputSchema
    : InferOr<Exclude<ExtractSchemaFromKey<TOptions["json"], "inputSchema">, undefined>, JsonResponse.DefaultInputSchema>);

  export type InferedOutputSchema<TOptions extends Options> = (TOptions["json"] extends undefined
    ? JsonResponse.DefaultOutputSchema
    : InferOr<Exclude<ExtractSchemaFromKey<TOptions["json"], "outputSchema">, undefined>, JsonResponse.DefaultOutputSchema>);
}

export function json<
  TIn extends Schema,
  TOut extends Schema
>(opts: JsonOptions.Base<TIn, TOut>): JsonOptions.Base<TIn, TOut> {
  return opts;
}
