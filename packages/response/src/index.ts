import { ResponseError, type DefaultErrorTypes, type ErrorDefinition, type ErrorHandler, type ErrorHandlerOptions, type ErrorRegistry } from "./error";
import type { MetaOptionsInferedSchema } from "./meta";
import type { Options, MetaOptions, ErrorOptions, JsonOptions } from "./options";
import { type Infer, checkSchema } from "@apiser/schema";
import { resolveHeaders } from "./headers";
import { JsonResponse } from "./response/json";

export function createResponseHandler<
  TMeta extends MetaOptions.Base,
  TOptions extends Options<TMeta>
>(options: TOptions) {
  return new ResponseHandler<TMeta, TOptions>({ options });
}

export type ResolveOptionsMeta<TOptions extends Options> = TOptions["meta"] extends undefined
  ? never
  : Exclude<TOptions["meta"], undefined>;

export class ResponseHandler<
  TMeta extends MetaOptions.Base,
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

  fail(name: string, _input?: unknown) {
    // TODO: validate zod schema (input)
    const error = this.errors[name];
    const input = error?.options?.input
      ? checkSchema(
        error?.options?.input,
        _input,
        {
          validationType: error?.options?.validationType ?? "parse"
        }
      )
      : null;

    const meta = this.prepareMeta();

    const handler = error?.handler;
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

  json<
    IInput extends JsonOptions.InferedInputSchema<TOptions>
  >(input: IInput, options?: JsonResponse.Options): JsonResponse.Base<
    IInput,
    JsonOptions.InferedOutputSchema<TOptions>
  > {
    const output = this.options?.json?.onData
      ? this.options.json.onData(input)
      : JsonResponse.defaultOnDataOutput(input)

    const str = JSON.stringify(output, null, 2);
    const headers: Record<string, string> = {
      ...options?.headers ?? {},
      ...resolveHeaders(
        this.options.json?.headers,
        {
          input,
          output
        }
      ) ?? {}
    }

    return new JsonResponse.Base(str, {
      headers,
      status: options?.status ?? 200,
      statusText: options?.statusText,
      input,
      output
    })
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
    handler: ErrorHandler<TOptions, THandlerOptions> | ErrorOptions.InferedSchema<TOptions>,
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
