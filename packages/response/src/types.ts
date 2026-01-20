export type AnyObject = Record<string, any>;
export type FunctionObject<T extends any, TFnArg = never> = T | (
  (TFnArg extends never
    ? (() => T)
    : ((arg: TFnArg) => T))
);

export type PromiseOr<T> = PromiseLike<T> | T;
// export type IfUndefined<> =
