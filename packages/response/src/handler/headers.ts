import type { FunctionObject, PromiseOr } from "@/types";

export type RawHeaders = Record<string, string>;
export type Headers<T> = FunctionObject<PromiseOr<RawHeaders>, T>;
