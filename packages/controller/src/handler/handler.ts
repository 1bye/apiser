import type * as ApiserResponse from "@apisr/response";
import { createResponseHandler, ErrorResponse } from "@apisr/response";
import { checkSchema, type InferUndefined, type Schema } from "@apisr/schema";
import assign from "es-toolkit/compat/assign";
import merge from "es-toolkit/compat/merge";
import omit from "es-toolkit/compat/omit";
import type { IsAny, Simplify } from "type-fest";
import {
	type CacheFn,
	type CacheOptions,
	type CacheStore,
	createCache,
	resolveCacheOptions,
} from "../cache";
import type { UnionToIntersection } from "../types";
import {
	type BindingDefinition,
	type BindingFactory,
	bindingInstanceSymbol,
	bindingsHelpers,
	type HandlerBindings,
} from "./bindings";
import { transformBodyIntoObject } from "./body";
import type { HandlerOptions } from "./options";
import type { HandlerRequest } from "./request";

export namespace HandlerFn {
	/**
	 * If a binding resolves to an object, spread its fields into the context.
	 * Otherwise, keep the result under the binding key.
	 */
	export type ExpandBindingResult<
		TKey extends string,
		TResult,
	> = TResult extends { [K in typeof bindingInstanceSymbol]: never }
		? Record<TKey, TResult>
		: TResult extends object
			? TResult
			: Record<TKey, TResult>;

	export type UnwrapBindingValueResult<
		T,
		A extends Awaited<T> = Awaited<T>,
	> = A;

	export type InferedBindingDefinition<
		TKey extends string,
		THandlerOptions extends HandlerOptions,
	> = TKey extends keyof HandlerBindings<THandlerOptions>
		? HandlerBindings<THandlerOptions>[TKey] extends BindingDefinition<
				infer TPayloadSchema,
				infer TResult,
				infer THandler,
				infer TResponseHandler,
				infer TMode
			>
			? BindingDefinition<
					TPayloadSchema,
					TResult,
					THandler,
					TResponseHandler,
					TMode
				>
			: HandlerBindings<THandlerOptions>[TKey] extends (
						...args: any[]
					) => BindingDefinition<
						infer TPayloadSchema,
						infer TResult,
						infer THandler,
						infer TResponseHandler,
						infer TMode
					>
				? BindingDefinition<
						TPayloadSchema,
						TResult,
						THandler,
						TResponseHandler,
						TMode
					>
				: never
		: never;

	/**
	 * Infer the resolved result type for a binding key from handler options.
	 */
	export type InferedBindingValue<
		TKey extends string,
		THandlerOptions extends HandlerOptions,
	> =
		InferedBindingDefinition<TKey, THandlerOptions> extends BindingDefinition<
			any,
			infer TResult,
			any,
			any,
			any
		>
			? UnwrapBindingValueResult<TResult>
			: never;

	export type InferedBindingMode<
		TKey extends string,
		THandlerOptions extends HandlerOptions,
	> =
		InferedBindingDefinition<TKey, THandlerOptions> extends BindingDefinition<
			any,
			any,
			any,
			any,
			infer TMode
		>
			? TMode
			: never;

	export type VariativeBindingResult<
		TExpandedResult extends Record<string, any>,
	> = {
		[TField in keyof TExpandedResult]: TExpandedResult[TField] | undefined;
	};

	export type InferedBindingContextValue<
		TKey extends string,
		THandlerOptions extends HandlerOptions,
	> =
		InferedBindingMode<TKey, THandlerOptions> extends "variativeInject"
			? VariativeBindingResult<
					ExpandBindingResult<TKey, InferedBindingValue<TKey, THandlerOptions>>
				>
			: ExpandBindingResult<TKey, InferedBindingValue<TKey, THandlerOptions>>;

	export type InferedCallOptionBindingKeys<
		TBindings extends Record<string, any>,
	> = keyof {
		[TKey in keyof TBindings as [TBindings[TKey]] extends [undefined]
			? never
			: [TBindings[TKey]] extends [false]
				? never
				: TKey & string]: any;
	};

	export type InferedAlwaysBindingKeys<THandlerOptions extends HandlerOptions> =
		{
			[TKey in keyof HandlerBindings<THandlerOptions> as InferedBindingMode<
				TKey & string,
				THandlerOptions
			> extends "alwaysInjected" | "variativeInject"
				? TKey & string
				: never]: any;
		};

	/**
	 * Infer the full bindings context shape for a given handler call.
	 * Binding results that are objects are merged together.
	 */
	export type InferedBindings<
		THandlerOptions extends HandlerOptions,
		TOptions extends Options<any, any>,
	> =
		TOptions extends Options<any, any, infer TBindings>
			? UnionToIntersection<
					{
						[TKey in
							| InferedCallOptionBindingKeys<TBindings>
							| keyof InferedAlwaysBindingKeys<THandlerOptions>]: InferedBindingContextValue<
							TKey & string,
							THandlerOptions
						>;
					}[
						| InferedCallOptionBindingKeys<TBindings>
						| keyof InferedAlwaysBindingKeys<THandlerOptions>]
				>
			: never;

	/**
	 * Input options for a specific handler call.
	 * Each binding key accepts the first argument of the corresponding binding factory.
	 */
	export type OptionsBindings<
		THandlerOptions extends HandlerOptions,
		TBindings extends
			HandlerBindings<THandlerOptions> = HandlerBindings<THandlerOptions>,
	> = {
		[TKey in keyof TBindings as InferedBindingMode<
			TKey & string,
			THandlerOptions
		> extends "toInject"
			? TKey
			: never]?: TBindings[TKey] extends (...args: any) => any
			? Parameters<TBindings[TKey]>[0]
			: undefined;
	};

	export type InferedCacheStore<THandlerOptions extends HandlerOptions> =
		THandlerOptions extends HandlerOptions<any, any, infer TCacheStore>
			? TCacheStore
			: CacheStore;

	export type InferedCacheOptions<
		THandlerOptions extends HandlerOptions,
		TPayload,
	> = CacheOptions<TPayload, InferedCacheStore<THandlerOptions>>;

	/**
	 * Per-invocation options passed to a handler call.
	 */
	export type Options<
		THandlerOptions extends HandlerOptions,
		TSchema extends Schema | undefined,
		TBindings extends
			OptionsBindings<THandlerOptions> = OptionsBindings<THandlerOptions>,
	> = {
		payload: TSchema;
		cache?: InferedCacheOptions<THandlerOptions, InferUndefined<TSchema>>;
	} & TBindings;

	/**
	 * Context object received by the handler callback.
	 */
	export type ResolveResponseHandler<THandlerOptions extends HandlerOptions> =
		THandlerOptions extends { responseHandler?: infer TResponseHandler }
			? [NonNullable<TResponseHandler>] extends [never]
				? ApiserResponse.AnyResponseHandler
				: NonNullable<TResponseHandler> extends ApiserResponse.AnyResponseHandler
					? NonNullable<TResponseHandler>
					: ApiserResponse.AnyResponseHandler
			: ApiserResponse.AnyResponseHandler;

	export type Context<
		THandlerOptions extends HandlerOptions,
		TOptions extends Options<any, any>,
	> = {
		payload: InferUndefined<TOptions["payload"]>;
		cache: CacheFn;
		redirect: <TReturnType extends any | undefined>(
			to: string,
			returnType: TReturnType
		) => TReturnType extends undefined ? {} : Exclude<TReturnType, undefined>;
	} & Pick<ResolveResponseHandler<THandlerOptions>, "fail"> &
		InferedBindings<THandlerOptions, TOptions>;

	/**
	 * Signature of the handler callback.
	 */
	export type Callback<
		THandlerOptions extends HandlerOptions,
		TOptions extends Options<any, any>,
	> = (ctx: Context<THandlerOptions, TOptions>) => any;

	/**
	 * Result of executing a handler component.
	 */
	export interface Result<TData, TError> {
		data: TData;
		error: TError;
	}

	/**
	 * The data input shape of a handler component.
	 */
	export type ComponentValue<TOptions extends Options<any, any>> =
		InferUndefined<TOptions["payload"]>;

	export type ResolveResponseHandlerOptions<
		THandlerOptions extends HandlerOptions,
	> = ResolveResponseHandler<THandlerOptions>["options"];

	/**
	 * Compiled handler component.
	 */
	export interface Component<
		THandlerOptions extends HandlerOptions,
		TOptions extends Options<any, any>,
		TResult,
	> {
		raw(data: { request: HandlerRequest }): Promise<Response>;
		(
			data: ComponentValue<TOptions>,
			opts?: ComponentOptions
		): Promise<
			Result<
				TResult,
				// IsAny<Exclude<THandlerOptions["responseHandler"], undefined>["options"]> extends true
				IsAny<ResolveResponseHandlerOptions<THandlerOptions>> extends false
					? ApiserResponse.ErrorOptions.InferedSchema<
							ResolveResponseHandlerOptions<THandlerOptions>
						>
					: Simplify<ApiserResponse.DefaultError>
			>
		>;
	}

	export interface ComponentOptions {
		/**
		 * @default direct
		 */
		mode?: "raw" | "direct";
	}

	export interface ComponentSelf {
		request: HandlerRequest | null;
	}

	/**
	 * Base handler factory function.
	 */
	export type Base<THandlerOptions extends HandlerOptions> = <
		//
		TPayloadSchema extends Schema | undefined,
		TOptions extends Options<THandlerOptions, TPayloadSchema>,
		//
		TCallback extends Callback<THandlerOptions, TOptions>,
	>(
		cb: TCallback,
		opts?: TOptions
	) => Component<THandlerOptions, TOptions, ReturnType<TCallback>>;
}

export function createHandler<THandlerOptions extends HandlerOptions>(
	handlerOptions: THandlerOptions
): HandlerFn.Base<THandlerOptions> {
	const anyResponseHandler = createResponseHandler({});

	// Excluded keys, used by library -> so any "interrupt" from bindings, will be excluded.
	const excludedKeys = ["payload", "fail", "cache"];

	const responseHandler = handlerOptions.responseHandler
		? handlerOptions.responseHandler
		: anyResponseHandler;
	const fail: typeof responseHandler.fail = (name: any, input: any) => {
		return responseHandler.fail(name, input);
	};

	const bindings = handlerOptions?.bindings?.(bindingsHelpers) ?? {};

	// @ts-expect-error
	// createHandler() -> handler(() => {...}, { ...options })
	return (cb, baseOptions) => {
		const optionsBindings = omit(baseOptions, excludedKeys) as Record<
			string,
			unknown | null | undefined
		>;

		// handler() -> returns function(...payload) -> Result
		// @ts-expect-error
		const componentFn: HandlerFn.Component<
			THandlerOptions,
			Exclude<typeof baseOptions, undefined>,
			ReturnType<typeof cb>
		> = async function (
			this: HandlerFn.ComponentSelf,
			rawPayload,
			componentOptions
		) {
			let self: HandlerFn.ComponentSelf | undefined;

			try {
				self = this as unknown as HandlerFn.ComponentSelf;
			} catch (e) {
				// pass
			}

			const request = self?.request;

			try {
				// Payload mapping
				const payloadSchema = baseOptions?.payload ?? null;
				let payload = rawPayload;

				if (payloadSchema) {
					payload = checkSchema(payloadSchema, rawPayload, {
						sources: {
							params: request?.params ?? {},
							body: transformBodyIntoObject(request?.body ?? {}),
							headers: request?.headers ?? {},
							query: request?.query ?? {},
							"handler.payload": {},
						},
					}) as typeof rawPayload;
				}

				const cache = createCache({
					payload,
					handlerCache: handlerOptions.cache as
						| CacheOptions<typeof payload>
						| undefined,
					callCache: baseOptions?.cache as
						| CacheOptions<typeof payload>
						| undefined,
				});

				const resolvedCacheOptions = resolveCacheOptions({
					handlerCache: handlerOptions.cache as
						| CacheOptions<typeof payload>
						| undefined,
					callCache: baseOptions?.cache as
						| CacheOptions<typeof payload>
						| undefined,
				});

				// Bindings mapping
				const bindingsToInclude = Object.entries(optionsBindings)
					.filter(([, value]) => value !== undefined && value !== null)
					.map(async ([bindingName, bindingPayload]) => {
						const binding = bindings[bindingName] as BindingFactory | undefined;

						if (!binding) {
							return undefined;
						}

						const definition = binding(bindingPayload);

						// TODO: take values from req/handler
						const definitionPayload = {};
						const definitionPayloadSchema = definition.payload;

						const definitionResolveResult = await definition.resolve({
							bindingName,
							payload: definitionPayload,
							fail,
							handler: {
								payload,
							},
							request: request ?? null,
						});

						if (
							!definitionResolveResult ||
							typeof definitionResolveResult === "undefined"
						) {
							console.warn(
								`While executing handler, binding ${bindingName}.resolve() result is undefined or null. Defaulting to {}`
							);

							return {};
						}

						// If it's instance, then we just avoid destructorization
						if (
							definitionResolveResult &&
							typeof definitionResolveResult === "object" &&
							bindingInstanceSymbol in definitionResolveResult
						) {
							return {
								[bindingName]: definitionResolveResult,
							};
						}
						if (
							typeof definitionResolveResult === "bigint" ||
							typeof definitionResolveResult === "boolean" ||
							typeof definitionResolveResult === "function" ||
							typeof definitionResolveResult === "number" ||
							typeof definitionResolveResult === "string" ||
							typeof definitionResolveResult === "symbol"
						) {
							return {
								[bindingName]: definitionResolveResult,
							};
						}

						// Otherwise we destructorize...
						return definitionResolveResult;
					})
					.filter((binding) => binding !== undefined && binding !== null);

				const resolvedPromise = await Promise.all(bindingsToInclude);
				const resolved = resolvedPromise.reduce(
					(acc, obj) => merge(acc, obj),
					{}
				);

				const executeCallback = async () => {
					// @ts-expect-error
					return await cb({
						...resolved,

						payload,
						cache,
						fail,
					});
				};

				const data = resolvedCacheOptions?.wrapHandler
					? await cache(
							resolvedCacheOptions.key
								? "handler:wrap"
								: [handlerOptions.name ?? "handler"],
							executeCallback
						)
					: await executeCallback();

				return {
					data,
					error: null,
				};
			} catch (e) {
				if (e instanceof ErrorResponse.Base) {
					return {
						data: null,
						error: e.output,
					};
				}

				// weird, but...
				try {
					throw responseHandler.fail("internal", {
						cause: e,
					});
				} catch (e) {
					return {
						data: null,
						error: (e as ErrorResponse.Base<any, any, any>).output,
					};
				}
			}
		};

		assign(componentFn, {
			raw: async (
				payload: Parameters<HandlerFn.Component<any, any, any>["raw"]>[0]
			) => {
				const emptyPayload = {} as InferUndefined<
					Exclude<typeof baseOptions, undefined>["payload"]
				>;
				const { data, error } = await componentFn.call(
					{
						request: payload.request,
					},
					emptyPayload,
					{
						mode: "raw",
					}
				);

				return await responseHandler.mapResponse({
					data,
					error,
				});
			},
		});

		return componentFn;
	};
}
