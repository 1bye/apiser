import type { PromiseOr } from "@/types";
import type { ErrorOptionsInferedSchema, Options } from "./options";
import type { ExtractSchema, Infer, Schema } from "./schema";

// Start of types ------------------

export type DefaultErrorTypes = "unauthorized" | "forbidden" | "notFound" | "badRequest" | "conflict" | "tooMany" | "internal";

export type DefaultError = {
  message: string;
  code: string;
  name: string;

  stack?: string[];
};

export type ErrorHandler<TOptions extends Options, THandlerOptions extends ErrorHandlerOptions> = (data: {
  meta: (TOptions["meta"] extends undefined
    ? never
    : Infer<ExtractSchema<TOptions["meta"]>>);
  input: Infer<THandlerOptions["input"]>;
}) => PromiseOr<
  ErrorOptionsInferedSchema<TOptions>
>;

export interface ErrorHandlerOptions<TSchema extends Schema = Schema> {
  input?: TSchema;
}

export type ErrorDefinition<TOptions extends Options, THandlerOptions extends ErrorHandlerOptions> = {
  handler: ErrorHandler<TOptions, THandlerOptions> | ErrorOptionsInferedSchema<TOptions>;
  options: THandlerOptions;
};

export type ErrorRegistry<TOptions extends Options> = Record<string, ErrorDefinition<TOptions, any>>;

// End of types ------------------

/**
 *
 */
export class ResponseError extends Error {


  constructor() {

  }
}
