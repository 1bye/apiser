import type { Infer, InferUndefined, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";
import type { BindingDefinition, HandlerBindings } from "./bindings";
import type { UnionToIntersection } from "../types";

export namespace HandlerFn {
  /**
   * If a binding resolves to an object, spread its fields into the context.
   * Otherwise, keep the result under the binding key.
   */
  export type ExpandBindingResult<TKey extends string, TResult> = TResult extends object
    ? TResult
    : Record<TKey, TResult>;

  /**
   * Infer the resolved result type for a binding key from handler options.
   */
  export type InferedBindingValue<TKey extends string, THandlerOptions extends HandlerOptions>
    = (TKey extends keyof HandlerBindings<THandlerOptions>
      ? (HandlerBindings<THandlerOptions>[TKey] extends BindingDefinition<any, infer TResult, any, any>
        ? TResult
        : (HandlerBindings<THandlerOptions>[TKey] extends (...args: any[]) => BindingDefinition<any, infer TResult, any, any>
          ? TResult
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
  export interface Result<T> { data: T; error: any; };

  /**
   * The data input shape of a handler component.
   */
  export type ComponentValue<TOptions extends Options<any, any>> = InferUndefined<TOptions["payload"]>;

  /**
   * Compiled handler component.
   */
  export interface Component<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>, TResult> {
    (data: ComponentValue<TOptions>): Result<TResult>;
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

export function createHandler<THandlerOptions extends HandlerOptions>(options: THandlerOptions): HandlerFn.Base<THandlerOptions> {
  return () => {

  };
}
