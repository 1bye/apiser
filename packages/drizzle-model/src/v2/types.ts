export type Compose<T, U> = T & U;
export type Fallback<A, B> = A extends undefined ? B : A;
export type Replace<T, R> = Omit<T, keyof R> & R;
export type UnwrapArray<T> = T extends (infer R)[] ? R : T;

export type AddToValues<T extends Record<PropertyKey, any>, A> = {
  [K in keyof T]: T[K] & A
};

export type AddUnionToValues<T extends Record<PropertyKey, any>, A> = {
  [K in keyof T]: T[K] | A
};

export interface RecursiveBooleanRecord {
  [key: string]: boolean | RecursiveBooleanRecord;
}
