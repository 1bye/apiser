export type Compose<T, U> = T & U;
export type Fallback<A, B> = A extends undefined ? B : A;
export type Replace<T, R> = Omit<T, keyof R> & R;
export type UnwrapArray<T> = T extends (infer R)[] ? R : T;

export type AddToValues<T extends Record<PropertyKey, any>, A> = {
	[K in keyof T]: T[K] & A;
};

export type AddUnionToValues<T extends Record<PropertyKey, any>, A> = {
	[K in keyof T]: T[K] | A;
};

export interface RecursiveBooleanRecord {
	[key: string]: boolean | RecursiveBooleanRecord;
}

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type Without<FirstType, SecondType> = {
	[KeyType in Exclude<keyof FirstType, keyof SecondType>]?: never;
};
export type MergeExclusive<FirstType, SecondType> =
	| FirstType
	| SecondType extends object
	?
			| (Without<FirstType, SecondType> & SecondType)
			| (Without<SecondType, FirstType> & FirstType)
	: FirstType | SecondType;

/**
 * Infer item of Array<>. If not Array<> return type.
 */
export type InferArrayItem<T extends any | any[]> = T extends any[]
	? T extends (infer Item)[]
		? Item
		: T
	: T;

/**
 * Applies Array<> to T if condition is true, otherwise return T as non array.
 */
export type ApplyArrayIf<
	TCondition extends true | false,
	T,
> = TCondition extends true ? T[] : T;

/**
 * Applies Array<> to T if TArray is Array<>, if not return T as non array.
 */
export type ApplyArrayIfArray<TArray extends any | any[], T> = ApplyArrayIf<
	TArray extends any[] ? true : false,
	T
>;
