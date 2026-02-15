import type { AnyResponseHandler } from "@apiser/response";
import type { BindingsFactory, BindingsHelpers, BindingsInput, BindingsWithNames } from "../bindings";

/**
 * Infer the response handler type from handler options.
 */
export type HandlerResponseHandler<TOptions extends HandlerOptions<any, any>> = TOptions["responseHandler"];

/**
 * Options used to configure a controller handler.
 */
export interface HandlerOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>
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
}

/**
 * Handler options with helper methods.
 */
export type ExtendedHandlerOptions<TOptions extends HandlerOptions<any, any>> = TOptions & {
  extend(): ExtendedHandlerOptions<TOptions>;
};

/**
 * Create handler options with type inference (bindings factory).
 */
export function createOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>
>(options: HandlerOptions<TResponseHandler, TBindings>): ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings>>;

/**
 * Create handler options with type inference.
 */
export function createOptions<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TBindings extends Record<string, any> = Record<string, any>
>(options: HandlerOptions<TResponseHandler, TBindings>): ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings>> {
  return ({
    ...options,

    extend() {
      return this as unknown as ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings>>;
    }
  }) as ExtendedHandlerOptions<HandlerOptions<TResponseHandler, TBindings>>;
}
