import type { AnyResponseHandler } from "@apiser/response";
import type { BindingsFactory, BindingsHelpers, BindingsInput, BindingsWithNames } from "../bindings";
import type { CacheOptions, CacheStore } from "../../cache";

/**
 * Infer the response handler type from handler options.
 */
export type HandlerResponseHandler<TOptions extends HandlerOptions<any, any, any>> = TOptions["responseHandler"];

/**
 * Options used to configure a controller handler.
 */
export interface HandlerOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>,
  TCacheStore extends CacheStore = CacheStore
> {
  /**
   * Name of handler (controller)
   */
  name?: string;

  /**
   * Bindings object or factory.
   */
  bindings?: (bindings: BindingsHelpers<TResponseHandler>) => BindingsInput<TBindings>;

  /**
   * Response handler instance.
   */
  responseHandler?: TResponseHandler;

  /**
   * Cache options used as defaults for all handler calls.
   */
  cache?: CacheOptions<unknown, TCacheStore>;
}

/**
 * Handler options with helper methods.
 */
export type ExtendedHandlerOptions<TOptions extends HandlerOptions<any, any, any>> = TOptions & {
  extend(): ExtendedHandlerOptions<TOptions>;
};

/**
 * Create handler options with type inference (bindings factory).
 */
export function createOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>,
  TCacheStore extends CacheStore = CacheStore
>(options: HandlerOptions<TResponseHandler, TBindings, TCacheStore>): ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings, TCacheStore>>;

/**
 * Create handler options with type inference.
 */
export function createOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>,
  TCacheStore extends CacheStore = CacheStore
>(options: HandlerOptions<TResponseHandler, TBindings, TCacheStore>): ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings, TCacheStore>> {
  return ({
    ...options,

    extend() {
      return this as unknown as ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings, TCacheStore>>;
    }
  }) as ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings, TCacheStore>>;
}
