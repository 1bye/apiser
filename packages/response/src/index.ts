import { type DefaultErrorTypes, type ErrorDefinition, type ErrorHandler, type ErrorHandlerOptions, type ErrorRegistry } from "./error";
import type { Options, MetaOptions, ErrorOptions, JsonOptions } from "./options";
import { type Infer, checkSchema } from "@apiser/schema";
import { resolveHeaders } from "./headers";
import { JsonResponse } from "./response/json";
import { TextResponse } from "./response/text";
import { ErrorResponse } from "./response/error";
import type { Binary } from "./response/binary";

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
  private preasignedMeta: Partial<MetaOptions.InferedSchema<TOptions>>;

  constructor({ options, errors, preasignedMeta }: {
    options: TOptions;
    errors?: TErrors;
    preasignedMeta?: Partial<MetaOptions.InferedSchema<TOptions>>;
  }) {
    this.options = options;
    this.errors = errors ?? ({} as TErrors);
    this.preasignedMeta = preasignedMeta ?? {};
  }

  fail<TKey extends keyof TErrors & string, TInput extends Infer<TErrors[TKey]["options"]["input"]>>(
    name: TKey,
    input?: TInput
  ): ErrorResponse.Base<TKey, MetaOptions.InferedSchema<TOptions>, TInput>;

  fail(
    name: DefaultErrorTypes,
    input?: Record<string, any>
  ): ErrorResponse.Base<DefaultErrorTypes, MetaOptions.InferedSchema<TOptions>, Record<string, any>>;

  /**
   *
   * @param name
   * @param _input
   * @returns
   */
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

    return new ErrorResponse.Base({
      meta,
      name,
      output
    });
  }

  /**
   *
   * @param _input
   * @param options
   * @returns
   */
  json<
    IInput extends JsonOptions.InferedInputSchema<TOptions>
  >(_input: IInput, options?: JsonResponse.Options): JsonResponse.Base<
    IInput,
    JsonOptions.InferedOutputSchema<TOptions>
  > {
    const jsonOptions = this.options?.json;

    // Check input by schema
    const input = jsonOptions?.inputSchema
      ? checkSchema(jsonOptions.inputSchema, _input, {
        validationType: jsonOptions.validationType ?? "parse"
      })
      : _input;

    // Get raw output from input
    const _output = this.options?.json?.onData
      ? this.options.json.onData(input)
      : JsonResponse.defaultOnDataOutput(input);

    // Check output by schema
    const output = jsonOptions?.outputSchema
      ? checkSchema(jsonOptions.outputSchema, _output, {
        validationType: jsonOptions.validationType ?? "parse"
      })
      : _output;

    const str = JSON.stringify(output, null, 2);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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

  /**
   *
   * @param text
   * @param options
   * @returns
   */
  text(text: string, options?: TextResponse.Options) {
    return new TextResponse.Base(text, {
      ...options ?? {}
    })
  }

  binary(binary: Binary) {

  }

  /**
   * Create a new `ResponseHandler` from partial meta as a default preassigned meta for next responses
   * @param _meta
   * @returns
   */
  withMeta(_meta: Partial<MetaOptions.InferedSchema<TOptions>>): ResponseHandler<TMeta, TOptions, TErrors> {
    const metaOptions = this.options.meta;
    const meta = metaOptions?.schema
      ? checkSchema(metaOptions.schema.partial(), _meta, {
        validationType: metaOptions.validationType ?? "parse"
      })
      : _meta;

    return new ResponseHandler<TMeta, TOptions, TErrors>({
      options: this.options,
      errors: this.errors,
      preasignedMeta: meta
    });
  }

  /**
   *
   * @param name
   * @param handler
   * @param options
   * @returns ResponseHandler
   */
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

  private prepareMeta(): MetaOptions.InferedSchema<TOptions> {
    const objOrFn = this.options.meta?.default;

    return {
      ...(this.preasignedMeta ?? {}),
      ...typeof objOrFn === "function" ? objOrFn() : objOrFn
    }
  }
}
