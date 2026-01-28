import type { Infer, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";
import type { BindingModelOptions, ModelIdentifier } from "./bindings/model";

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
  THandler = unknown
> = {
  payload: InferBindingPayload<TPayloadSchema>;
  handler: THandler;
  bindingName: string;
};

/**
 * Definition of a binding.
 */
export type BindingDefinition<
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown
> = {
  payload?: TPayloadSchema;
  resolve: (ctx: BindingResolveContext<TPayloadSchema, THandler>) => TResult;
};

/**
 * Factory for creating a binding definition.
 */
export type BindingFactory<
  TArgs extends any[] = any[],
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown
> = (
  ...args: TArgs
) => BindingDefinition<TPayloadSchema, TResult, THandler>;

export declare const bindingInstanceSymbol: unique symbol;
/**
 * Unique type, to not destructorize object in handler function
 */
export type BindingInstance<T> = T & {
  [bindingInstanceSymbol]: never;
}

/**
 * Helpers available inside the bindings factory.
 */
export interface BindingsHelpers {
  /**
   * Pass-through helper for model bindings.
   */
  model<TModel extends ModelIdentifier>(model: TModel, _options?: BindingModelOptions<TModel>): BindingFactory<
    [boolean],
    Schema,
    BindingInstance<TModel>,
    unknown
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
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler>;

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
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler>;
}

/**
 * Map binding names into their resolver contexts.
 */
export type BindingsWithNames<TBindings> = {
  [TKey in keyof TBindings]: (TKey extends string
    ? (TBindings[TKey] extends BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler>
      ? BindingDefinition<TPayloadSchema, TResult, THandler>
      : (TBindings[TKey] extends (...args: infer TArgs) => BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler>
        ? (...args: TArgs) => BindingDefinition<TPayloadSchema, TResult, THandler>
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
  | BindingsFactory<BindingsWithNames<TBindings>>;

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
  : ResolveBindings<Exclude<TOptions["bindings"], undefined>>;

/**
 * Runtime bindings helpers for use alongside createOptions.
 */
export const bindings: BindingsHelpers = {
  model: (model) => {
    return () => ({
      resolve: () => model as BindingInstance<typeof model>
    })
  },
  bind: (bindingOrFactory: any, maybeFactory?: any) => {
    if (typeof bindingOrFactory === "string") {
      return maybeFactory;
    }

    return bindingOrFactory;
  }
};
