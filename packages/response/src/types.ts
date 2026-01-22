export type AnyObject = Record<string, any>;
export type FunctionObject<TResult extends any, TFnArg = never> = TResult | (
  (TFnArg extends never
    ? (() => TResult)
    : ((arg: TFnArg) => TResult))
);

export type PromiseOr<T> = PromiseLike<T> | T;
// export type IfUndefined<> =
