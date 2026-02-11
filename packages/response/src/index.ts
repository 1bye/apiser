import { type DefaultError, type DefaultErrorTypes, type ErrorDefinition, type ErrorHandler, type ErrorHandlerOptions, type ErrorRegistry } from "./error";
import type { Options, MetaOptions, ErrorOptions, JsonOptions } from "./options";
import { type Infer, checkSchema } from "@apiser/schema";
import { resolveHeaders } from "./headers";
import { JsonResponse } from "./response/json";
import { TextResponse } from "./response/text";
import { ErrorResponse } from "./response/error";
import { BinaryResponse, type Binary } from "./response/binary";
import type { BinaryOptions } from "./options";
import { options as optionMethods } from "./options";
import { generateDefaultErrors } from "./error/default";

export type { DefaultError } from "./error";
export { options, type ErrorOptions } from "./options";

export type {
  Options
}

export {
  JsonResponse,
  TextResponse,
  ErrorResponse,
  BinaryResponse
}

export function createResponseHandler<
  TMeta extends MetaOptions.Base,
  TError extends ErrorOptions.Base,
  TJson extends JsonOptions.Base,
  TBinary extends BinaryOptions.Base,
  TOptions extends Options<TMeta, TError, TJson, TBinary> = Options<TMeta, TError, TJson, TBinary>
>(opts: TOptions | ((options: typeof optionMethods) => TOptions)) {
  const _options = typeof opts === "function"
    ? opts(optionMethods)
    : opts;

  return new ResponseHandler<TMeta, TError, TJson, TBinary, TOptions>({ options: _options });
}

export type ResolveOptionsMeta<TOptions extends Options> = TOptions["meta"] extends undefined
  ? never
  : Exclude<TOptions["meta"], undefined>;

export type AnyResponseHandler = ResponseHandler<any, any, any, any, any>;

export class ResponseHandler<
  TMeta extends MetaOptions.Base,
  TError extends ErrorOptions.Base,
  TJson extends JsonOptions.Base,
  TBinary extends BinaryOptions.Base,
  TOptions extends Options<TMeta, TError, TJson, TBinary>,
  TErrors extends ErrorRegistry<TOptions> = {}
> {
  public options: TOptions;

  private errors: TErrors;
  private preasignedMeta: Partial<MetaOptions.InferedSchema<TOptions>>;

  /**
   * Create a `ResponseHandler` instance.
   *
   * Prefer using {@link createResponseHandler} instead of calling this directly.
   *
   * @param params - Constructor params.
   * @param params.options - Handler options.
   * @param params.errors - Optional pre-defined error registry.
   * @param params.preasignedMeta - Optional meta merged into each response.
   */
  constructor({ options, errors, preasignedMeta }: {
    options: TOptions;
    errors?: TErrors;
    preasignedMeta?: Partial<MetaOptions.InferedSchema<TOptions>>;
  }) {
    this.options = options;
    this.errors = errors ?? generateDefaultErrors<TOptions>(options?.error?.mapDefaultError) as TErrors ?? ({} as TErrors);
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
   * Create an `ErrorResponse` by name.
   *
   * If the error has an `input` schema, the `input` is validated according to `validationType`.
   * The resulting error response also includes prepared `meta`.
   *
   * @param name - Error name (registered via `defineError` or built-in default types).
   * @param _input - Optional error payload to validate (if a schema exists).
   * @returns Error response instance.
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
      : _input;

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
   * Create a JSON `Response`.
   *
   * Validates input/output using configured schemas (if present), applies `onData` transformation,
   * and resolves/merges headers.
   *
   * @typeParam IInput - Inferred input type for configured JSON input schema.
   * @param _input - JSON input value.
   * @param options - Optional response init options.
   * @returns JSON response instance.
   */
  json<
    IInput extends JsonOptions.InferedSchema<TOptions>
  >(_input: IInput, options?: JsonResponse.Options): JsonResponse.Base<
    IInput
  > {
    const jsonOptions = this.options?.json;

    // Check input by schema
    // const input = jsonOptions?.inputSchema
    //   ? checkSchema(jsonOptions.inputSchema, _input, {
    //     validationType: jsonOptions.validationType ?? "parse"
    //   })
    //   : _input;

    // Get raw output from input
    const _output = jsonOptions?.mapData
      ? jsonOptions.mapData(_input)
      : JsonResponse.defaultOnDataOutput(_input);

    // Check output by schema
    // const output = jsonOptions?.outputSchema
    //   ? checkSchema(jsonOptions.outputSchema, _output, {
    //     validationType: jsonOptions.validationType ?? "parse"
    //   })
    //   : _output;

    const str = JSON.stringify(_output, null, 2);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers ?? {},
      ...resolveHeaders(
        jsonOptions?.headers,
        {
          output: _output
        }
      ) ?? {}
    }

    return new JsonResponse.Base(str, {
      headers,
      status: options?.status ?? 200,
      statusText: options?.statusText,
      output: _output
    })
  }

  /**
   * Create a plain text `Response`.
   *
   * @param text - Raw text response body.
   * @param options - Optional response init options.
   * @returns Text response instance.
   */
  text(text: string, options?: TextResponse.Options) {
    return new TextResponse.Base(text, {
      ...options ?? {}
    })
  }

  /**
   * Create a binary `Response`.
   *
   * Applies optional `binary.onData` transformation and resolves/merges headers.
   *
   * @param binary - Binary payload (Blob/ArrayBuffer/Uint8Array/ReadableStream).
   * @param options - Optional response init options.
   * @returns Binary response instance.
   */
  binary(binary: Binary, options?: BinaryResponse.Options) {
    const binaryOptions = this.options?.binary;

    const data = binaryOptions?.mapData
      ? binaryOptions.mapData(binary)
      : binary;

    const headers: Record<string, string> = {
      ...options?.headers ?? {},
      ...resolveHeaders(binaryOptions?.headers, data) ?? {}
    }

    return new BinaryResponse.Base(data as any, {
      headers,
      status: options?.status ?? 200,
      statusText: options?.statusText
    })
  }

  /**
   * Create a new `ResponseHandler` with preassigned meta.
   *
   * The provided meta is validated against the configured meta schema (if present).
   *
   * @param _meta - Partial meta that will be merged into each next response.
   * @returns New `ResponseHandler` instance.
   */
  withMeta(_meta: Partial<MetaOptions.InferedSchema<TOptions>>): ResponseHandler<TMeta, TError, TJson, TBinary, TOptions, TErrors> {
    const metaOptions = this.options.meta;
    const meta = metaOptions?.schema
      ? checkSchema(metaOptions.schema.partial(), _meta, {
        validationType: metaOptions.validationType ?? "parse"
      })
      : _meta;

    return new ResponseHandler<TMeta, TError, TJson, TBinary, TOptions, TErrors>({
      options: this.options,
      errors: this.errors,
      preasignedMeta: meta
    });
  }

  /**
   * Define a named error handler.
   *
   * Returns a new `ResponseHandler` instance with the extended error registry.
   *
   * @typeParam TName - Error name.
   * @typeParam THandlerOptions - Handler options type.
   * @param name - Error name to register.
   * @param handler - Error handler function or static error output.
   * @param options - Error handler options (e.g. input schema).
   * @returns New `ResponseHandler` instance with the new error registered.
   */
  defineError<
    TName extends string,
    THandlerOptions extends ErrorHandlerOptions | undefined
  >(
    name: TName,
    handler: ErrorHandler<TOptions, THandlerOptions> | ErrorOptions.InferedSchema<TOptions>,
    options?: THandlerOptions
  ): ResponseHandler<
    TMeta, TError, TJson, TBinary,
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

  /**
   * Prepare `meta` by merging preassigned meta (from `withMeta`) with default meta (if any).
   *
   * @returns Resolved meta object.
   */
  private prepareMeta(): MetaOptions.InferedSchema<TOptions> {
    const objOrFn = this.options.meta?.default;

    return {
      ...typeof objOrFn === "function" ? objOrFn() : objOrFn,
      ...(this.preasignedMeta ?? {}),
    }
  }
}
