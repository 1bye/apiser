import type { Infer, InferUndefined, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";
import type { HandlerBindings } from "./bindings";

export namespace HandlerFn {
  export type InferedBindingValue<TKey extends string, THandlerOptions extends HandlerOptions>
    = (THandlerOptions["bindings"] extends undefined
      ? never
      : Exclude<THandlerOptions["bindings"], undefined>);

  export type InferedBindings<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>> =
    TOptions extends Options<any, any, infer TBindings> ? {
      [TKey in keyof TBindings as TBindings[TKey] extends undefined ? never : TKey & string]: InferedBindingValue<TKey & string, THandlerOptions>;
    } : never;

  export type OptionsBindings<
    THandlerOptions extends HandlerOptions,
    TBindings extends HandlerBindings<THandlerOptions> = HandlerBindings<THandlerOptions>
  > = {
      [TKey in keyof TBindings]?: (TBindings[TKey] extends (...args: any) => any
        ? Parameters<TBindings[TKey]>[0]
        : undefined);
    };

  export type Options<
    THandlerOptions extends HandlerOptions,
    TSchema extends Schema | undefined,
    TBindings extends OptionsBindings<THandlerOptions> = OptionsBindings<THandlerOptions>
  > = {
    payload: TSchema;
  } & TBindings;

  export type Context<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>> = {
    payload: InferUndefined<TOptions["payload"]>
  } & Pick<
    Exclude<THandlerOptions["responseHandler"], undefined>,
    "fail"
  > & InferedBindings<THandlerOptions, TOptions>;
  export type Callback<
    THandlerOptions extends HandlerOptions,
    TOptions extends Options<any, any>
  > = (ctx: Context<THandlerOptions, TOptions>) => any;

  export interface Result<T> { data: T; error: any; };

  export type ComponentValue<TOptions extends Options<any, any>> = InferUndefined<TOptions["payload"]>;

  export interface Component<THandlerOptions extends HandlerOptions, TOptions extends Options<any, any>, TResult> {
    (data: ComponentValue<TOptions>): Result<TResult>;
  }

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
