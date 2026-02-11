import { type InferUndefined, type Schema, checkSchema } from "@apiser/schema";
import type * as ApiserResponse from "@apiser/response";
import type { HandlerOptions } from "./options";
import { bindingInstanceSymbol, bindingsHelpers, type BindingDefinition, type BindingFactory, type BindingInstance, type HandlerBindings } from "./bindings";
import type { UnionToIntersection } from "../types";
import type { IsAny, MergeExclusive, Simplify } from "type-fest";
import { createResponseHandler, ErrorResponse } from "@apiser/response";
import omit from "es-toolkit/compat/omit";
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
  export type Context<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>> = {
    payload: InferUndefined<TOptions["payload"]>
  } & Pick<
    Exclude<THandlerOptions["responseHandler"], undefined>,
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

  export type ResolveResponseHandlerOptions<THandlerOptions extends HandlerOptions> = Exclude<THandlerOptions["responseHandler"], undefined>["options"];

  /**
   * Compiled handler component.
   */
  export interface Component<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>, TResult> {
    (data: ComponentValue<TOptions>): Promise<
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
    return async function (this: HandlerFn.ComponentSelf, rawPayload) {
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
              }
            });

            // If it's instance, then we just avoid destructorization
            if (definitionResolveResult && typeof definitionResolveResult === "object" && bindingInstanceSymbol in definitionResolveResult) {
              return {
                [bindingName]: definitionResolveResult
              };
            }

            // Otherwise we destructorize...
            return definitionResolveResult;
          })
          .filter(binding => binding !== undefined && binding !== null);

        // @ts-ignore
        const data = await cb({
          ...await Promise.all(bindingsToInclude),

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
  };
}
