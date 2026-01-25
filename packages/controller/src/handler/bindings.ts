import type { Infer, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";

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
  TBindingName extends string = string
> = {
  payload: InferBindingPayload<TPayloadSchema>;
  handler: THandler;
  bindingName: TBindingName;
};

/**
 * Definition of a binding.
 */
export type BindingDefinition<
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown,
  TBindingName extends string = string
> = {
  payload?: TPayloadSchema;
  resolve: (ctx: BindingResolveContext<TPayloadSchema, THandler, TBindingName>) => TResult;
};

/**
 * Factory for creating a binding definition.
 */
export type BindingFactory<
  TArgs extends any[] = any[],
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown,
  TBindingName extends string = string
> = (
  ...args: TArgs
) => BindingDefinition<TPayloadSchema, TResult, THandler, TBindingName>;

/**
 * Helpers available inside the bindings factory.
 */
export interface BindingsHelpers {
  /**
   * Pass-through helper for model bindings.
   */
  model<TModel>(model: TModel, _options?: unknown): TModel;

  /**
   * Wrap a binding factory so it is typed consistently.
   */
  bind<
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown,
    TBindingName extends string = string
  >(
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TBindingName>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TBindingName>;

  /**
   * Provide a binding name explicitly to keep bindingName as a literal type.
   */
  bind<
    TBindingName extends string,
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown
  >(
    bindingName: TBindingName,
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TBindingName>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TBindingName>;
}

/**
 * Map binding names into their resolver contexts.
 */
export type BindingsWithNames<TBindings> = {
  [TKey in keyof TBindings]: TKey extends string
    ? TBindings[TKey] extends BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, any>
      ? BindingDefinition<TPayloadSchema, TResult, THandler, TKey>
      : TBindings[TKey] extends (...args: infer TArgs) => BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, any>
        ? (...args: TArgs) => BindingDefinition<TPayloadSchema, TResult, THandler, TKey>
        : TBindings[TKey]
    : TBindings[TKey];
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
  model: (model) => model,
  bind: (bindingOrFactory: any, maybeFactory?: any) => {
    if (typeof bindingOrFactory === "string") {
      return maybeFactory;
    }

    return bindingOrFactory;
  }
};
