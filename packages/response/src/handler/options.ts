import type { Infer, Schema } from "@typeschema/main";
import type { Headers } from "./headers";
import type { ValidationType } from "./validation";
import type { ResponseTypes } from "./response";
import type { FunctionObject, PromiseOr } from "@/types";
import type { Binary } from "./binary";

export interface MetaOptions<TSchema extends Schema = Schema, TInferSchema extends Infer<Schema> = Infer<TSchema>> {
  schema?: TSchema;
  default?: FunctionObject<TInferSchema, never>;
  validate?: ValidationType;
}

export interface JsonOptions<TSchema extends Schema = Schema, TInferSchema extends Infer<Schema> = Infer<TSchema>> {
  headers?: Headers<TInferSchema>;
  schema?: TSchema;
  validate?: ValidationType;

  onData?: (data: any) => PromiseOr<TInferSchema>;
}

export interface ErrorOptions<
  TMeta extends MetaOptions,
  TSchema extends Schema = Schema,
  TInferSchema extends Infer<Schema> = Infer<TSchema>
> {
  headers?: Headers<TInferSchema>;
  schema?: TSchema;
  validate?: ValidationType;

  onError: (ctx: {
    error: Error;
    meta: TMeta;
    parsedError?: TInferSchema;
  }) => PromiseOr<TInferSchema>;
}

export interface BinaryOptions {
  headers?: Headers<Binary>;

  onData: (data: Binary) => Binary;
}

export interface ErrorHandler<
  TMetaOptions extends MetaOptions,
  TErrorOptions extends ErrorOptions<TMetaOptions>,
  TSchema extends Schema = Schema
> {
  handler: (data: {
    input: Infer<TSchema>;

  }) => Infer<Exclude<TErrorOptions["schema"], undefined>>;

  input: TSchema;
}

export interface Options<
  TMetaOptions extends MetaOptions,
  TErrorOptions extends ErrorOptions<TMetaOptions>
> {
  headers?: Headers<{
    type: ResponseTypes;
    data: any;
  }>;

  meta?: TMetaOptions;
  json?: JsonOptions;
  error?: TErrorOptions;

  binary?: BinaryOptions;

  errors?: Record<string, ErrorHandler<TMetaOptions, TErrorOptions>>;
}
