import type { PromiseOr } from "@/types";
import type { ErrorOptionsInferedSchema, Options } from "./options";
import type { ExtractSchema, Infer, Schema } from "./schema";

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

export interface ErrorHandlerConfig {

}

export interface ErrorHandlerOptions<TSchema extends Schema = Schema> {
  input?: TSchema;
}
