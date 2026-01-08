export type Compose<T, U> = T & U;
export type Fallback<A, B> = A extends undefined ? B : A;
export type Replace<T, R> = Omit<T, keyof R> & R;

export type AddToValues<T extends Record<PropertyKey, any>, A> = {
  [K in keyof T]: T[K] & A
};

export type AddUnionToValues<T extends Record<PropertyKey, any>, A> = {
  [K in keyof T]: T[K] | A
};
