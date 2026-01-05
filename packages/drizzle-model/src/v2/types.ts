export type Compose<T, U> = T & U;
export type Fallback<A, B> = A extends undefined ? B : A;
export type Replace<T, R> = Omit<T, keyof R> & R;
