import type { Infer, Schema } from "@apiser/schema"
import type { PromiseOr } from "./types";

export type Methods = "GET" | "POST" | "DELETE" | "PATCH" | "PUT" | "OPTIONS";
export type ResponseStatus = 200 | 400;

export type ExtractParam<Path, NextPart> = Path extends `:${infer Param}` ? Record<Param, string> & NextPart : NextPart;

export type ExtractParams<Path> = Path extends `${infer Segment}/${infer Rest}`
  ? ExtractParam<Segment, ExtractParams<Rest>>
  : ExtractParam<Path, {}>

export interface ProbeFactory<TSchema extends Schema> {
  (ctx: {
    faker: any;
  }): PromiseOr<Infer<TSchema>>;
}

export type AnyEndpoint = Endpoint<any, any, any, any>;

export interface Endpoint<
  TQuerySchema extends Schema,
  TBodySchema extends Schema,
  THeaderSchema extends Schema,
  TParamsSchema extends Schema
> {
  /**
   * @default GET
   */
  method?: Methods | string;
  /**
   * @default from path property
   */
  operationId?: string;
  summary?: string;
  path: string;

  querySchema?: TQuerySchema;
  bodySchema?: TBodySchema;
  headersSchema?: THeaderSchema;
  paramsSchema?: TParamsSchema;

  probe?: Record<ResponseStatus | string | number, {
    query?: ProbeFactory<TQuerySchema> | Infer<TQuerySchema>;
    body?: ProbeFactory<TBodySchema> | Infer<TBodySchema>;
    headers?: ProbeFactory<THeaderSchema> | Infer<THeaderSchema>;
    params?: ProbeFactory<TParamsSchema> | Infer<TParamsSchema>;
  }>
}

export function endpoint<
  TQuerySchema extends Schema,
  TBodySchema extends Schema,
  THeaderSchema extends Schema,
  TParamsSchema extends Schema,
>(endpoint: Endpoint<TQuerySchema, TBodySchema, THeaderSchema, TParamsSchema>): Endpoint<TQuerySchema, TBodySchema, THeaderSchema, TParamsSchema> {
  return endpoint;
}
