import type { FunctionObject } from "@/types";

export type RawHeaders = Record<string, string>;

/**
 * A header configuration value that can be either a static `RawHeaders` object
 * or a function that receives context `T` and returns `RawHeaders`.
 *
 * Named `HeadersConfig` to avoid shadowing the global `Headers` Web API class.
 */
export type HeadersConfig<T> = FunctionObject<RawHeaders, T>;

/**
 * Acceptable headers input: either a Web API `Headers` instance or a plain
 * `Record<string, string>` object. Both are accepted wherever headers can be
 * supplied by the caller (e.g. `json()` / `binary()` options).
 */
export type HeadersInput = globalThis.Headers | RawHeaders;

/**
 * Convert a `HeadersInput` value (plain object or `Headers` instance) into a
 * Web API `Headers` instance.
 */
export function toHeaders(
	input: HeadersInput | null | undefined
): globalThis.Headers {
	if (!input) {
		return new globalThis.Headers();
	}
	if (input instanceof globalThis.Headers) {
		return input;
	}
	return new globalThis.Headers(input);
}

/**
 * Merge multiple header sources into a single `Headers` instance.
 *
 * - For `Set-Cookie` headers `.append()` is used so that multiple cookie
 *   directives are preserved as separate header entries.
 * - For every other header `.set()` is used, meaning later sources override
 *   earlier ones (last-writer-wins).
 *
 * Falsy sources are silently skipped, making it safe to pass the return value
 * of `resolveHeaders()` directly without an extra null check.
 */
export function mergeHeaders(
	...sources: (HeadersInput | null | undefined)[]
): globalThis.Headers {
	const result = new globalThis.Headers();

	for (const source of sources) {
		if (!source) {
			continue;
		}

		const h =
			source instanceof globalThis.Headers
				? source
				: new globalThis.Headers(source);

		h.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				result.append(key, value);
			} else {
				result.set(key, value);
			}
		});
	}

	return result;
}

/**
 * Resolve a `HeadersConfig` value (static object or factory function) against
 * the provided `input` context and return a `Headers` instance, or `null` if
 * no config was provided.
 */
export function resolveHeaders(
	headers: HeadersConfig<any> | undefined,
	input: unknown
): globalThis.Headers | null {
	if (!headers) {
		return null;
	}

	const raw =
		typeof headers === "function"
			? (headers as (arg: unknown) => RawHeaders)(input)
			: headers;

	return raw ? toHeaders(raw) : null;
}
