export type PromiseOr<T> = PromiseLike<T> | T;

export type UnwrapFunctionObject<T> = T extends (...args: any) => any
  ? ReturnType<T> : T;
