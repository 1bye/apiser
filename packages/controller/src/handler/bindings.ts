import type { Infer, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";
import type { BindingModelOptions, ModelIdentifier } from "./bindings/model";
import type { AnyResponseHandler } from "@apiser/response";
import type { HandlerRequest } from "./request";

/**
 * Schema type for a binding payload.
 */
export type BindingPayload<TSchema extends Schema | undefined = Schema | undefined> = TSchema;

/**
 * Infer payload type from a schema.
 */
export type InferBindingPayload<TSchema> = TSchema extends Schema
  ? Infer<TSchema>
  : TSchema;

/**
 * Context passed to a binding resolver.
 */
export type BindingResolveContext<
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  THandler = unknown,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined
> = {
  payload: InferBindingPayload<TPayloadSchema>;
  handler: THandler;
  bindingName: string;
  request: HandlerRequest | null;
} & Pick<
  Exclude<TResponseHandler, undefined>,
  "fail"
>;

/**
 * Definition of a binding.
 */
export type BindingDefinition<
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined
> = {
  payload?: TPayloadSchema;
  resolve: (ctx: BindingResolveContext<TPayloadSchema, THandler, TResponseHandler>) => Promise<TResult>;
};

/**
 * Factory for creating a binding definition.
 */
export type BindingFactory<
  TArgs extends any[] = any[],
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined
> = (
  ...args: TArgs
) => BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler>;

export const bindingInstanceSymbol = Symbol("handler_binding_instance");
/**
 * Unique type, to not destructorize object in handler function
 */
export type BindingInstance<T> = T & {
  [bindingInstanceSymbol]: never;
}

/**
 * Helpers available inside the bindings factory.
 */
export interface BindingsHelpers<
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined
> {
  /**
   * Pass-through helper for model bindings.
   */
  model<TModel extends ModelIdentifier>(model: TModel, _options?: BindingModelOptions<TModel, TResponseHandler> | BindingModelOptions<TModel, TResponseHandler>[]): BindingFactory<
    [boolean],
    Schema,
    BindingInstance<TModel>,
    unknown,
    TResponseHandler
  >;

  /**
   * Wrap a binding factory so it is typed consistently.
   */
  bind<
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown
  >(
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler>;

  /**
   * Provide a binding name explicitly to keep bindingName as a literal type.
   */
  bind<
    TName extends string,
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown
  >(
    bindingName: TName,
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler>;

  value<TValue>(value: TValue): BindingFactory<
    [boolean],
    Schema,
    BindingInstance<TValue>,
    unknown,
    TResponseHandler
  >
}

/**
 * Map binding names into their resolver contexts.
 */
export type BindingsWithNames<TBindings> = {
  [TKey in keyof TBindings]: (TKey extends string
    ? (TBindings[TKey] extends BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, infer TResponseHandler>
      ? BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler>
      : (TBindings[TKey] extends (...args: infer TArgs) => BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, infer TResponseHandler>
        ? (...args: TArgs) => BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler>
        : TBindings[TKey]))
    : TBindings[TKey]);
};

/**
 * Function that returns the bindings object.
 */
export type BindingsFactory<TBindings> = (bindings: BindingsHelpers) => TBindings;

/**
 * Bindings can be provided as an object or a factory.
 */
export type BindingsInput<TBindings> =
  | BindingsWithNames<TBindings>
// | BindingsFactory<BindingsWithNames<TBindings>>;

/**
 * Resolve bindings from a factory or object.
 */
export type ResolveBindings<TBindings> = TBindings extends (...args: any[]) => infer TResult
  ? TResult
  : TBindings;

/**
 * Infer resolved bindings from handler options.
 */
export type HandlerBindings<TOptions extends HandlerOptions<any, any>> = TOptions["bindings"] extends undefined
  ? {}
  : ResolveBindings<ReturnType<Exclude<TOptions["bindings"], undefined>>>;

/**
 * Runtime bindings helpers for use alongside createOptions.
 */
export const bindings: BindingsHelpers = {
  model: (model, options) => {
    return () => ({
      resolve: async ({ request }) => {
        const url = request?.url;

        return ({ ...model, [bindingInstanceSymbol]: "" }) as BindingInstance<typeof model>
      }
    })
  },
  bind: (bindingOrFactory: any, maybeFactory?: any) => {
    if (typeof bindingOrFactory === "string") {
      return maybeFactory;
    }

    return bindingOrFactory;
  },
  value: (value) => {
    return () => ({
      resolve: async () => value as BindingInstance<typeof value>
    })
  }
};

export const bindingsHelpers = bindings;
