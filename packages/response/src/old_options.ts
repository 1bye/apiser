// import type { Infer as _Infer, Schema as _Schema } from "@typeschema/main";
// import type { Infer, Schema } from "@typeschema/all";
import type { Headers } from "./headers";
import type { ValidationType } from "./validation";
import type { ResponseTypes } from "./response";
import type { FunctionObject, PromiseOr } from "@/types";
import type { Binary } from "./binary";
import type { DefaultError } from "./error";

// type Schema = any | _Schema;
// type Infer<T> = T extends _Schema ? _Infer<T> : never;

type InferErrorSchema<TErrorOptions> = TErrorOptions extends ErrorOptions<any, infer TSchema, any> ? TSchema : Schema;
type InferMetaSchema<TMetaOptions> = TMetaOptions extends MetaOptions<infer TSchema, any> ? TSchema : Schema;

type InferOptionalSchema<T> = T extends Schema ? Infer<T> : never;
type InferOptionalSchemaOrNever<T> = [T] extends [Schema] ? Infer<T> : never;
type InferOptionalSchemaOrEmptyObject<T> = [T] extends [Schema] ? Infer<T> : {};

type InferMetaData<TMetaOptions> = TMetaOptions extends { schema?: infer S; }
  ? InferOptionalSchemaOrEmptyObject<NonNullable<S>>
  : {};

export interface MetaOptions<TSchema extends Schema = Schema, TInferSchema extends Infer<TSchema> = Infer<TSchema>> {
  schema?: TSchema;
  default?: FunctionObject<TInferSchema, never>;
  validate?: ValidationType;
}

export interface JsonOptions<TSchema extends Schema = Schema, TInferSchema extends Infer<TSchema> = Infer<TSchema>> {
  headers?: Headers<TInferSchema>;
  schema?: TSchema;
  validate?: ValidationType;

  onData?: (data: any) => PromiseOr<TInferSchema>;
}

export interface ErrorOptions<
  TMeta extends MetaOptions | undefined,
  TSchema extends Schema = Schema,
  TInferSchema extends Infer<TSchema> = Infer<TSchema>
> {
  headers?: Headers<TInferSchema>;
  schema: TSchema;
  validate?: ValidationType;

  onError?: (ctx: {
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
  TMetaOptions extends MetaOptions | undefined,
  TErrorOptions extends ErrorOptions<TMetaOptions>,
  TSchema extends Schema | never = never
> {
  handler: (data: {
    input: InferOptionalSchemaOrNever<TSchema>;
    meta: TMetaOptions;
  }) => TErrorOptions["schema"] extends undefined
    ? DefaultError
    : Infer<InferErrorSchema<TErrorOptions>>;

  input?: TSchema;
}

export interface Options<
  TMetaOptions extends MetaOptions | undefined = undefined,
  TErrorOptions extends ErrorOptions<TMetaOptions> = ErrorOptions<TMetaOptions>
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
