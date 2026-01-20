// import type { MetaOptions, Options, ErrorOptions } from "./options";

import type { DefaultErrorTypes, ErrorHandler, ErrorHandlerOptions } from "./error";
import type { Options, MetaOptions, ErrorOptionsInferedSchema } from "./options";

// export function createResponseHandler<
//   TMetaOptions extends MetaOptions,
//   TErrorOptions extends ErrorOptions<TMetaOptions>,
//   TOptions extends Options<TMetaOptions, TErrorOptions> = Options<TMetaOptions, TErrorOptions>
// >(options: TOptions) {
//   return new ResponseHandler<TMetaOptions, TErrorOptions, TOptions>(options);
// }

// export class ResponseHandler<
//   TMetaOptions extends MetaOptions,
//   TErrorOptions extends ErrorOptions<TMetaOptions>,
//   TOptions extends Options<TMetaOptions, TErrorOptions> = Options<TMetaOptions, TErrorOptions>
// > {
//   public options: TOptions;

//   constructor(options: TOptions) {
//     this.options = options;
//   }
// }

export function createResponseHandler<
  TMeta extends MetaOptions,
  TOptions extends Options<TMeta>
>(options: TOptions) {
  return new ResponseHandler<TMeta, TOptions>(options);
}

export type ResolveOptionsMeta<TOptions extends Options> = TOptions["meta"] extends undefined
  ? never
  : Exclude<TOptions["meta"], undefined>;

export class ResponseHandler<
  TMeta extends MetaOptions,
  TOptions extends Options<TMeta>,
  TErrors extends string = string
> {
  public options: TOptions;

  constructor(options: TOptions) {
    this.options = options;
  }

  fail(name: TErrors) {

  }

  withMeta() {

  }

  // withErrors<
  //   TValue extends Record<string, ErrorHandler<ResolveOptionsMeta<TOptions>>>
  // >(errors: TValue): ResponseHandler<TMeta, TOptions, TErrors | (keyof TValue & string)> {
  //   return this;
  // }

  defineError<
    TName extends string,
    THandlerOptions extends ErrorHandlerOptions
  >(name: TName | DefaultErrorTypes, handler: ErrorHandler<TOptions, THandlerOptions> | ErrorOptionsInferedSchema<TOptions>, options: THandlerOptions): ResponseHandler<TMeta, TOptions, TErrors | TName> {
    return this;
  };
}
