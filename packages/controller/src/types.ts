/**
 * Convert a union type into an intersection type.
 *
 * Example:
 * - `{ a: string } | { b: number }` -> `{ a: string } & { b: number }`
 */
export type UnionToIntersection<T> = (
	T extends any
		? (k: T) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type PromiseOr<T> = PromiseLike<T> | T;
