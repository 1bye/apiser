import { ResponseError, type DefaultErrorTypes, type ErrorDefinition, type ErrorHandler, type ErrorHandlerOptions, type ErrorRegistry } from "./error";
import type { MetaOptionsInferedSchema } from "./meta";
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
  private preasignedMeta: Partial<MetaOptionsInferedSchema<TOptions>>;

  constructor({ options, errors, preasignedMeta }: {
    options: TOptions;
    errors?: TErrors;
    preasignedMeta?: Partial<MetaOptionsInferedSchema<TOptions>>;
  }) {
    this.options = options;
    this.errors = errors ?? ({} as TErrors);
    this.preasignedMeta = preasignedMeta ?? {};
  }

  fail<TKey extends keyof TErrors & string, TInput extends Infer<TErrors[TKey]["options"]["input"]>>(
    name: TKey,
    input?: TInput
  ): ResponseError<TKey, MetaOptionsInferedSchema<TOptions>, TInput>;

  fail(
    name: DefaultErrorTypes,
    input?: Record<string, any>
  ): ResponseError<DefaultErrorTypes, MetaOptionsInferedSchema<TOptions>, Record<string, any>>;

  fail(name: string, input?: unknown) {
    // TODO: validate zod schema (input)

    const meta = this.prepareMeta();

    const handler = this.errors[name]?.handler;
    const output = typeof handler === "function"
      // @ts-ignore
      ? handler({ meta, input })
      : handler;

    return new ResponseError({
      meta,
      name,
      output
    });
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

  withMeta(meta: Partial<MetaOptionsInferedSchema<TOptions>>): ResponseHandler<TMeta, TOptions, TErrors> {
    // TODO: validate zod schema based on `validationType` setting
    return new ResponseHandler<TMeta, TOptions, TErrors>({
      options: this.options,
      errors: this.errors,
      preasignedMeta: meta
    });
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

  private prepareMeta(): MetaOptionsInferedSchema<TOptions> {
    const objOrFn = this.options.meta?.default;

    return {
      ...(this.preasignedMeta ?? {}),
      ...typeof objOrFn === "function" ? objOrFn() : objOrFn
    }
  }
}
