import type { AnyResponseHandler } from "@apisr/response";
import type { CacheOptions, CacheStore } from "../../cache";
import type { BindingsHelpers, BindingsInput } from "../bindings";

/**
 * Infer the response handler type from handler options.
 */
export type HandlerResponseHandler<
	TOptions extends HandlerOptions<any, any, any>,
> = TOptions["responseHandler"];

/**
 * Options used to configure a controller handler.
 */
export interface HandlerOptions<
	TResponseHandler extends AnyResponseHandler | undefined =
		| AnyResponseHandler
		| undefined,
	TBindings extends Record<string, any> = Record<string, any>,
	TCacheStore extends CacheStore = CacheStore,
> {
	/**
	 * Bindings object or factory.
	 */
	bindings?: (
		bindings: BindingsHelpers<TResponseHandler>
	) => BindingsInput<TBindings>;

	/**
	 * Cache options used as defaults for all handler calls.
	 */
	cache?: CacheOptions<unknown, TCacheStore>;
	/**
	 * Name of handler (controller)
	 */
	name?: string;

	/**
	 * Response handler instance.
	 */
	responseHandler?: TResponseHandler;
}

/**
 * Handler options with helper methods.
 */
export type ExtendedHandlerOptions<
	TOptions extends HandlerOptions<any, any, any>,
> = TOptions & {
	extend(): ExtendedHandlerOptions<TOptions>;
};

/**
 * Create handler options with type inference (bindings factory).
 */
export function createOptions<
	TResponseHandler extends AnyResponseHandler | undefined =
		| AnyResponseHandler
		| undefined,
	TBindings extends Record<string, any> = Record<string, any>,
	TCacheStore extends CacheStore = CacheStore,
>(
	options: HandlerOptions<TResponseHandler, TBindings, TCacheStore>
): ExtendedHandlerOptions<
	HandlerOptions<TResponseHandler, TBindings, TCacheStore>
>;

/**
 * Create handler options with type inference.
 */
export function createOptions<
	TResponseHandler extends AnyResponseHandler | undefined =
		| AnyResponseHandler
		| undefined,
	TBindings extends Record<string, any> = Record<string, any>,
	TCacheStore extends CacheStore = CacheStore,
>(
	options: HandlerOptions<TResponseHandler, TBindings, TCacheStore>
): ExtendedHandlerOptions<
	HandlerOptions<TResponseHandler, TBindings, TCacheStore>
> {
	return {
		...options,

		extend() {
			return this as unknown as ExtendedHandlerOptions<
				HandlerOptions<TResponseHandler, TBindings, TCacheStore>
			>;
		},
	} as ExtendedHandlerOptions<
		HandlerOptions<TResponseHandler, TBindings, TCacheStore>
	>;
}
