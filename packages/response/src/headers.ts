import type { FunctionObject, PromiseOr } from "@/types";

export type RawHeaders = Record<string, string>;
export type Headers<T> = FunctionObject<RawHeaders, T>;

export function resolveHeaders(
  headers: Headers<any> | undefined,
  input: unknown
): RawHeaders | null {
  const result =
    typeof headers === "function"
      ? (headers as (arg: unknown) => RawHeaders)(input)
      : headers;

  if (!headers) {
    return null;
  }

  // @ts-ignore
  return result;
}
