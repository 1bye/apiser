import type { ExtractSchema, Infer, InferOr, Schema, ValidationType } from "@apiser/schema";
import type { Headers } from "@/headers";
import type { PromiseOr } from "@/types";
import type { Options } from "./base";
import type { JsonResponse } from "@/response/json";

export namespace JsonOptions {
  export interface Base<TSchema extends Schema = Schema> {
    headers?: Headers<Infer<TSchema>>;

    schema?: TSchema;
    validationType?: ValidationType;

    mapData?: (data: Infer<TSchema>) => PromiseOr<Infer<TSchema>>;
  }

  // export type InferedInputSchema<TOptions extends Options> = (TOptions["json"] extends undefined
  //   ? JsonResponse.DefaultInputSchema
  //   : InferOr<Exclude<ExtractSchemaFromKey<TOptions["json"], "inputSchema">, undefined>, JsonResponse.DefaultInputSchema>);

  export type InferedSchema<TOptions extends Options> = (TOptions["json"] extends undefined
    ? JsonResponse.DefaultSchema
    : InferOr<Exclude<ExtractSchema<TOptions["json"]>, undefined>, JsonResponse.DefaultSchema>);
}

export function json<
  TSchema extends Schema,
>(opts: JsonOptions.Base<TSchema>): JsonOptions.Base<TSchema> {
  return opts;
}
