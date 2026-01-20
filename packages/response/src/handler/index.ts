import { ResponseError, type DefaultErrorTypes, type ErrorDefinition, type ErrorHandler, type ErrorHandlerOptions, type ErrorRegistry } from "./error";
import type { Options, MetaOptions, ErrorOptionsInferedSchema } from "./options";
import type { Infer } from "./schema";

export function createResponseHandler<
  TMeta extends MetaOptions,
  TOptions extends Options<TMeta>
>(options: TOptions) {
  return new ResponseHandler<TMeta, TOptions>({ options });
}

export type ResolveOptionsMeta<TOptions extends Options> = TOptions["meta"] extends undefined
  ? never
  : Exclude<TOptions["meta"], undefined>;

export class ResponseHandler<
  TMeta extends MetaOptions,
  TOptions extends Options<TMeta>,
  TErrors extends ErrorRegistry<TOptions> = {}
> {
  public options: TOptions;
  private errors: TErrors;

  constructor({ options, errors }: {
    options: TOptions;
    errors?: TErrors;
  }) {
    this.options = options;
    this.errors = errors ?? ({} as TErrors);
  }

  fail<TKey extends keyof TErrors & string>(
    name: TKey,
    input?: Infer<TErrors[TKey]["options"]["input"]>
  ): ResponseError;

  fail(
    name: DefaultErrorTypes,
    input?: Record<string, any>
  ): ResponseError;

  fail(name: string, input?: unknown) {
    return new ResponseError();
  }

  json() {

  }

  ok() {

  }

  text() {

  }

  binary() {

  }

  image() {

  }

  withMeta() {

  }

  defineError<
    TName extends string,
    THandlerOptions extends ErrorHandlerOptions
  >(
    name: TName,
    handler: ErrorHandler<TOptions, THandlerOptions> | ErrorOptionsInferedSchema<TOptions>,
    options: THandlerOptions
  ): ResponseHandler<
    TMeta,
    TOptions,
    TErrors & Record<TName, ErrorDefinition<TOptions, THandlerOptions>>
  > {
    const nextErrors = {
      ...(this.errors as Record<string, unknown>),
      [name]: {
        handler,
        options
      }
    } as TErrors & Record<TName, ErrorDefinition<TOptions, THandlerOptions>>;

    const instance = new ResponseHandler({
      options: this.options,
      errors: nextErrors
    });

    return instance;
  };
}
