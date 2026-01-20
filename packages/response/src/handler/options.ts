import type { FunctionObject, PromiseOr } from "@/types";
import type { ValidationType } from "./validation";
import type { Headers } from "./headers";
import type { Binary } from "./binary";
import type { z } from "zod";
import type { ResponseTypes } from "./response";
import type { DefaultError } from "./error";
import type { ExtractSchema, InferOr, Schema } from "./schema";

export interface MetaOptions<TSchema extends Schema = Schema> {
  schema?: TSchema;

  default?: FunctionObject<z.infer<TSchema>, never>;
  validate?: ValidationType;
}

export type ErrorOptionsInferedSchema<TOptions extends Options> = (TOptions["error"] extends undefined
  ? DefaultError
  : InferOr<ExtractSchema<TOptions["error"]>, DefaultError>);

export interface ErrorOptions<
  TSchema extends Schema = Schema,
> {
  headers?: Headers<z.infer<TSchema>>;
  schema?: TSchema;
  validate?: ValidationType;

  onError?: (ctx: {
    error: Error;
    meta: unknown;
    parsedError?: TSchema extends undefined ? DefaultError : z.infer<TSchema>;
  }) => PromiseOr<TSchema extends undefined ? DefaultError : z.infer<TSchema>>;
}

export interface JsonOptions<TSchema extends Schema = Schema> {
  headers?: Headers<z.infer<TSchema>>;
  schema?: TSchema;
  validate?: ValidationType;

  onData?: (data: any) => PromiseOr<z.infer<TSchema>>;
}

export interface BinaryOptions {
  headers?: Headers<Binary>;

  onData: (data: Binary) => Binary;
}

export interface ErrorHandler<TMeta extends MetaOptions, TSchema extends Schema = Schema> {
  handler: (data: {
    meta: z.infer<TMeta["schema"]>;
    input: TSchema;
  }) => void;

  input: TSchema;
}

export interface Options<TMeta extends MetaOptions = MetaOptions> {
  headers?: Headers<{
    type: ResponseTypes;
    data: any;
  }>;

  meta?: TMeta;
  error?: ErrorOptions;
  json?: JsonOptions;

  binary?: BinaryOptions;
}
