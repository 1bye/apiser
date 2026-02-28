import type { TableColumns } from "dist/index.d.mts";
import type { TableRelationalConfig } from "drizzle-orm/relations";

export type ModelFormatResult<
	TResult extends Record<string, any>,
	TFormat extends Record<string, any> | undefined,
	TTable extends TableRelationalConfig,
> = TFormat extends undefined
	? TResult
	: Pick<TResult, keyof TFormat & string> &
			ResolveFormatCustomFields<Exclude<TFormat, undefined>, TTable>;

export type ResolveFormatCustomFields<
	TFormat extends Record<string, any>,
	TTable extends TableRelationalConfig,
> = {
	// [TKey in TableColumns<TTable> as TFormat[TKey] extends never ? never : TKey]:
	[TKey in keyof TFormat as TableColumns<TTable>[TKey & string] extends never
		? never
		: TKey & string]: TFormat[TKey & string];
	// [TKey in TFormat]: TFormat[TKey & string];
};

// export type ModelFormatResult<
//   TResult extends Promise<any>,
//   TFormat extends Record<string, any> | undefined
// > = TFormat extends undefined ? TResult : (TResult extends Promise<infer T>
//   ? (T extends Record<string, any>
//     ? ModelFormatValue<T, Exclude<TFormat, undefined>>
//     : never)
//   : never);
