export type ModelFormatValue<
  TValue extends Record<string, any>,
  TFormat extends Record<string, any> | undefined
> = TFormat extends undefined
  ? TValue
  : TValue extends (infer TItem)[]
    ? (TItem extends Record<string, any>
        ? ModelFormatValue<TItem, TFormat>[]
        : TValue)
    : Omit<TValue, keyof TFormat> & TFormat;

// export type ModelFormatResult<
//   TResult extends Promise<any>,
//   TFormat extends Record<string, any> | undefined
// > = TFormat extends undefined ? TResult : (TResult extends Promise<infer T>
//   ? (T extends Record<string, any>
//     ? ModelFormatValue<T, Exclude<TFormat, undefined>>
//     : never)
//   : never);
