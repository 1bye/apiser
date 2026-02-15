import { type InferUndefined, type Schema, checkSchema } from "@apiser/schema";
import type * as ApiserResponse from "@apiser/response";
import type { HandlerOptions } from "./options";
import { bindingInstanceSymbol, bindingsHelpers, type BindingDefinition, type BindingFactory, type BindingInstance, type HandlerBindings } from "./bindings";
import type { UnionToIntersection } from "../types";
import type { IsAny, MergeExclusive, Simplify } from "type-fest";
import { createResponseHandler, ErrorResponse } from "@apiser/response";
import omit from "es-toolkit/compat/omit";
import merge from "es-toolkit/compat/merge";
import assign from "es-toolkit/compat/assign";
import type { HandlerRequest } from "./request";
import { transformBodyIntoObject } from "./body";

export namespace HandlerFn {
  /**
   * If a binding resolves to an object, spread its fields into the context.
   * Otherwise, keep the result under the binding key.
   */
  export type ExpandBindingResult<TKey extends string, TResult> = TResult extends { [K in typeof bindingInstanceSymbol]: never }
    ? Record<TKey, TResult>
    : (TResult extends object ? TResult : Record<TKey, TResult>)

  export type UnwrapBindingValueResult<T, A extends Awaited<T> = Awaited<T>> = A;

  /**
   * Infer the resolved result type for a binding key from handler options.
   */
  export type InferedBindingValue<TKey extends string, THandlerOptions extends HandlerOptions>
    = (TKey extends keyof HandlerBindings<THandlerOptions>
      ? (HandlerBindings<THandlerOptions>[TKey] extends { resolve: (...args: any[]) => infer TResult }
        ? UnwrapBindingValueResult<TResult>
        : (HandlerBindings<THandlerOptions>[TKey] extends (...args: any[]) => { resolve: (...args: any[]) => infer TResult }
          ? UnwrapBindingValueResult<TResult>
          : never))
      : never);

  /**
   * Infer the full bindings context shape for a given handler call.
   * Binding results that are objects are merged together.
   */
  export type InferedBindings<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>> =
    TOptions extends Options<any, any, infer TBindings>
    ? UnionToIntersection<{
      [TKey in keyof TBindings as TBindings[TKey] extends undefined ? never : TKey & string]: ExpandBindingResult<
        TKey & string,
        InferedBindingValue<TKey & string, THandlerOptions>
      >;
    }[keyof {
      [TKey in keyof TBindings as TBindings[TKey] extends undefined ? never : TKey & string]: any;
    }]>
    : never;

  /**
   * Input options for a specific handler call.
   * Each binding key accepts the first argument of the corresponding binding factory.
   */
  export type OptionsBindings<
    THandlerOptions extends HandlerOptions,
    TBindings extends HandlerBindings<THandlerOptions> = HandlerBindings<THandlerOptions>
  > = {
      [TKey in keyof TBindings]?: (TBindings[TKey] extends (...args: any) => any
        ? Parameters<TBindings[TKey]>[0]
        : undefined);
    };

  /**
   * Per-invocation options passed to a handler call.
   */
  export type Options<
    THandlerOptions extends HandlerOptions,
    TSchema extends Schema | undefined,
    TBindings extends OptionsBindings<THandlerOptions> = OptionsBindings<THandlerOptions>
  > = {
    payload: TSchema;
  } & TBindings;

  /**
   * Context object received by the handler callback.
   */
  export type ResolveResponseHandler<THandlerOptions extends HandlerOptions> =
    THandlerOptions extends { responseHandler?: infer TResponseHandler }
      ? ([NonNullable<TResponseHandler>] extends [never]
        ? ApiserResponse.AnyResponseHandler
        : NonNullable<TResponseHandler> extends ApiserResponse.AnyResponseHandler
          ? NonNullable<TResponseHandler>
          : ApiserResponse.AnyResponseHandler)
      : ApiserResponse.AnyResponseHandler;

  export type Context<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>> = {
    payload: InferUndefined<TOptions["payload"]>;
    redirect: <TReturnType extends any | undefined>(to: string, returnType: TReturnType) => TReturnType extends undefined ? {} : Exclude<TReturnType, undefined>;
  } & Pick<
    ResolveResponseHandler<THandlerOptions>,
    "fail"
  > & InferedBindings<THandlerOptions, TOptions>;

  /**
   * Signature of the handler callback.
   */
  export type Callback<
    THandlerOptions extends HandlerOptions,
    TOptions extends Options<any, any>
  > = (ctx: Context<THandlerOptions, TOptions>) => any;

  /**
   * Result of executing a handler component.
   */
  export interface Result<TData, TError> {
    data: TData;
    error: TError;
  };

  /**
   * The data input shape of a handler component.
   */
  export type ComponentValue<TOptions extends Options<any, any>> = InferUndefined<TOptions["payload"]>;

  export type ResolveResponseHandlerOptions<THandlerOptions extends HandlerOptions> = ResolveResponseHandler<THandlerOptions>["options"];

  /**
   * Compiled handler component.
   */
  export interface Component<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>, TResult> {
    (data: ComponentValue<TOptions>, opts?: ComponentOptions): Promise<
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

    raw(data: {
      request: HandlerRequest;
    }): Promise<Response>;
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
  export interface Base<THandlerOptions extends HandlerOptions> {
    <
      //
      TPayloadSchema extends Schema | undefined,
      TOptions extends Options<THandlerOptions, TPayloadSchema>,
      //
      TCallback extends Callback<THandlerOptions, TOptions>
    >
      // ^ Type Arguments
      (cb: TCallback, opts?: TOptions): Component<
        THandlerOptions,
        TOptions,
        ReturnType<TCallback>
      >
  }
}

export function createHandler<THandlerOptions extends HandlerOptions>(handlerOptions: THandlerOptions): HandlerFn.Base<THandlerOptions> {
  const anyResponseHandler = createResponseHandler({});

  // Excluded keys, used by library -> so any "interrupt" from bindings, will be excluded.
  const excludedKeys = ["payload", "fail"]

  const responseHandler = handlerOptions.responseHandler ? handlerOptions.responseHandler : anyResponseHandler;
  const fail: typeof responseHandler.fail = (name: any, input: any) => {
    return responseHandler.fail(name, input);
  };

  const bindings = handlerOptions?.bindings?.(bindingsHelpers) ?? {};

  // @ts-ignore
  // createHandler() -> handler(() => {...}, { ...options })
  return (cb, baseOptions) => {
    const optionsBindings = omit(baseOptions, excludedKeys) as Record<string, unknown | null | undefined>;

    // handler() -> returns function(...payload) -> Result
    // @ts-ignore
    const componentFn: HandlerFn.Component<
      THandlerOptions,
      Exclude<typeof baseOptions, undefined>,
      ReturnType<typeof cb>
    > = async function (this: HandlerFn.ComponentSelf, rawPayload, componentOptions) {
      let self: HandlerFn.ComponentSelf | undefined = undefined;

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
            }
          }) as typeof rawPayload;
        }

        // Bindings mapping
        const bindingsToInclude = Object.entries(optionsBindings)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(async ([bindingName, bindingPayload]) => {
            const binding = bindings[bindingName] as BindingFactory | undefined;

            if (!binding) return undefined;

            const definition = binding(bindingPayload);

            // TODO: take values from req/handler
            const definitionPayload = {};
            const definitionPayloadSchema = definition.payload;

            const definitionResolveResult = await definition.resolve({
              bindingName,
              payload: definitionPayload,
              fail,
              handler: {
                payload
              },
              request: request ?? null
            });

            if (!definitionResolveResult || typeof definitionResolveResult === "undefined") {
              console.warn(`While executing handler, binding ${bindingName}.resolve() result is undefined or null. Defaulting to {}`);

              return {}
            }

            // If it's instance, then we just avoid destructorization
            if (definitionResolveResult && typeof definitionResolveResult === "object" && bindingInstanceSymbol in definitionResolveResult) {
              return {
                [bindingName]: definitionResolveResult
              };
            } else if (
              typeof definitionResolveResult === "bigint" ||
              typeof definitionResolveResult === "boolean" ||
              typeof definitionResolveResult === "function" ||
              typeof definitionResolveResult === "number" ||
              typeof definitionResolveResult === "string" ||
              typeof definitionResolveResult === "symbol"
            ) {
              return {
                [bindingName]: definitionResolveResult
              };
            }

            // Otherwise we destructorize...
            return definitionResolveResult;
          })
          .filter(binding => binding !== undefined && binding !== null);

        const resolvedPromise = await Promise.all(bindingsToInclude);
        const resolved = resolvedPromise.reduce((acc, obj) => merge(acc, obj), {});

        // @ts-ignore
        const data = await cb({
          ...resolved,

          payload,
          fail,
        });

        return {
          data,
          error: null
        }
      } catch (e) {
        if (e instanceof ErrorResponse.Base) {
          return {
            data: null,
            error: e.output
          }
        }

        // weird, but...
        try {
          throw responseHandler.fail("internal", {
            cause: e
          });
        } catch (e) {
          return {
            data: null,
            error: (e as ErrorResponse.Base<any, any, any>).output
          }
        }
      }
    }

    assign(componentFn, {
      raw: async (payload: Parameters<HandlerFn.Component<any, any, any>["raw"]>[0]) => {
        const emptyPayload = {} as InferUndefined<Exclude<typeof baseOptions, undefined>["payload"]>;
        const { data, error } = await componentFn.call({
          request: payload.request
        }, emptyPayload, {
          mode: "raw"
        });

        return await responseHandler.mapResponse({
          data,
          error
        });
      }
    });

    return componentFn;
  };
}
