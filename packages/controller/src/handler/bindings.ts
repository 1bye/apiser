import type { Infer, Schema } from "@apiser/schema";
import type { HandlerOptions } from "./options";
import type { BindingModelOptions, ModelIdentifier } from "./bindings/model";
import type { AnyResponseHandler } from "@apiser/response";
import type { HandlerRequest } from "./request";
import { transformBodyIntoObject } from "./body";
import type { PromiseOr } from "@/types";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

const getNestedValue = (source: Record<string, unknown>, key: string): unknown => {
  if (!key) return undefined;
  if (!key.includes(".")) return source[key];

  const parts = key.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

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

export type BindingInjectContext<TPayloadSchema extends Schema | undefined = Schema | undefined, THandler = unknown> = {
  payload: InferBindingPayload<TPayloadSchema>;
  request: HandlerRequest | null;
  bindingName: string;
  handler: THandler;
}

export type BindingMode = "alwaysInjected" | "toInject" | "variativeInject";

/**
 * Definition of a binding.
 */
export type BindingDefinition<
  TPayloadSchema extends Schema | undefined = Schema | undefined,
  TResult = unknown,
  THandler = unknown,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TMode extends BindingMode = "toInject"
> = {
  /**
   * Mode how binding is used.
   * - "toInject": expects user to pass `object` or `boolean` into handler options
   * - "alwaysInjected": binding is always injected into handler callback
   * - "variativeInject": decides if binding should be injected based on result from `inject` function.
   * @default toInject
   */
  mode?: TMode;
  inject?: (ctx: BindingInjectContext<TPayloadSchema, THandler>) => PromiseOr<boolean>;
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
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TMode extends BindingMode = "toInject"
> = (
  ...args: TArgs
) => BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler, TMode>;

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
    TResponseHandler,
    "toInject"
  >;

  /**
   * Wrap a binding factory so it is typed consistently.
   */
  bind<
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown,
    TMode extends BindingMode = "toInject"
  >(
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler, TMode>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler, TMode>;

  /**
   * Provide a binding name explicitly to keep bindingName as a literal type.
   */
  bind<
    TName extends string,
    TArgs extends any[] = any[],
    TPayloadSchema extends Schema | undefined = Schema | undefined,
    TResult = unknown,
    THandler = unknown,
    TMode extends BindingMode = "toInject"
  >(
    bindingName: TName,
    factory: BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler, TMode>
  ): BindingFactory<TArgs, TPayloadSchema, TResult, THandler, TResponseHandler, TMode>;

  value<TValue>(value: TValue): BindingFactory<
    [boolean],
    Schema,
    BindingInstance<TValue>,
    unknown,
    TResponseHandler,
    "toInject"
  >
}

/**
 * Map binding names into their resolver contexts.
 */
export type BindingsWithNames<TBindings> = {
  [TKey in keyof TBindings]: (TKey extends string
    ? (TBindings[TKey] extends BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, infer TResponseHandler, infer TMode>
      ? BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler, TMode>
      : (TBindings[TKey] extends (...args: infer TArgs) => BindingDefinition<infer TPayloadSchema, infer TResult, infer THandler, infer TResponseHandler, infer TMode>
        ? (...args: TArgs) => BindingDefinition<TPayloadSchema, TResult, THandler, TResponseHandler, TMode>
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
export type HandlerBindings<TOptions extends HandlerOptions<any, any, any>> = TOptions["bindings"] extends undefined
  ? {}
  : ResolveBindings<ReturnType<Exclude<TOptions["bindings"], undefined>>>;

/**
 * Runtime bindings helpers for use alongside createOptions.
 */
export const bindings: BindingsHelpers = {
  model: (model, options) => {
    const normalizedOptions = Array.isArray(options) ? options : (options ? [options] : [{}]);
    return () => ({
      resolve: async ({ request, fail }) => {
        const sources = {
          params: request?.params ?? {},
          query: request?.query ?? {},
          headers: request?.headers ?? {},
          body: request?.body ? transformBodyIntoObject(request.body) : {},
        };

        const keyValues: Record<string, unknown> = {};
        let combinedWhere: Record<string, unknown> | undefined;
        let hasWhere = false;
        let loadHandler: BindingModelOptions<ModelIdentifier, AnyResponseHandler>["load"] | undefined;
        let notFoundHandler: BindingModelOptions<ModelIdentifier, AnyResponseHandler>["notFound"] | undefined;

        for (const option of normalizedOptions) {
          const primaryKey = option?.primaryKey ?? "id";
          const from = option?.from ?? "params";
          const defaultFromKey = (model as ModelIdentifier).$modelName;
          const fromKey = option?.fromKey ?? (typeof defaultFromKey === "string" ? defaultFromKey : primaryKey);
          const source = sources[from] ?? {};
          const rawValue = typeof fromKey === "string" ? getNestedValue(source, fromKey) : undefined;
          const transformedValue = option?.transform ? option.transform() : rawValue;

          if (option?.load) loadHandler = option.load;
          if (option?.notFound) notFoundHandler = option.notFound;

          keyValues[primaryKey as string] = transformedValue;

          if (isPlainObject(option?.where)) {
            combinedWhere = {
              ...(combinedWhere ?? {}),
              ...option.where,
            };
            hasWhere = true;
          }

          if (typeof primaryKey === "string") {
            combinedWhere = {
              ...(combinedWhere ?? {}),
              [primaryKey]: transformedValue,
            };
            hasWhere = true;
          }
        }

        let resolvedModel: unknown = model;
        if (hasWhere && combinedWhere && typeof (resolvedModel as { where?: (value: unknown) => unknown }).where === "function") {
          resolvedModel = (resolvedModel as { where: (value: unknown) => unknown }).where(combinedWhere);
        }

        let result = resolvedModel;

        if (loadHandler) {
          result = await loadHandler({
            ...(keyValues as Record<string, any>),
            fail,
          } as any);

          if (result === undefined || result === null) {
            if (notFoundHandler) {
              const fallback = await notFoundHandler({
                ...(keyValues as Record<string, any>),
                fail,
              } as any);

              if (fallback !== undefined) {
                result = fallback;
              } else {
                throw fail("notFound" as any, keyValues as any);
              }
            } else {
              throw fail("notFound" as any, keyValues as any);
            }
          }
        }

        if (result && typeof result === "object") {
          return ({
            ...(result as Record<string, unknown>),
            [bindingInstanceSymbol]: "",
          }) as BindingInstance<typeof model>;
        }

        return result as BindingInstance<typeof model>;
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
      resolve: async () => {
        if (typeof value === "object") {
          return {
            ...value,
            [bindingInstanceSymbol]: "",
          } as BindingInstance<typeof value>
        }

        return value as BindingInstance<typeof value>;
      }
    })
  }
};

export const bindingsHelpers = bindings;
