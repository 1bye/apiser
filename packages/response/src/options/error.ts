import type {
	ExtractSchema,
	Infer,
	InferOr,
	Schema,
	ValidationType,
} from "@apisr/schema";
import type { DefaultError } from "@/error";
import type { Headers } from "@/headers";
import type { Options } from "@/options/base";
import type { PromiseOr } from "@/types";

export namespace ErrorOptions {
	export interface Base<TSchema extends Schema = Schema> {
		headers?: Headers<Infer<TSchema>>;

		mapDefaultError?: (
			error: DefaultError
		) => TSchema extends undefined ? DefaultError : Infer<TSchema>;

		mapError?: (ctx: {
			error: Error | null;
			meta: unknown;
			parsedError?: TSchema extends undefined ? DefaultError : Infer<TSchema>;
		}) => PromiseOr<TSchema extends undefined ? DefaultError : Infer<TSchema>>;

		onFailedSchemaValidation?: (ctx: {
			data: unknown;
		}) => PromiseOr<TSchema extends undefined ? DefaultError : Infer<TSchema>>;
		schema?: TSchema;
		validationType?: ValidationType;
	}

	export type InferedSchemaFromBase<TError extends Base> = InferOr<
		ExtractSchema<TError>,
		DefaultError
	>;

	export type InferedSchema<TOptions extends Options> =
		TOptions["error"] extends undefined
			? DefaultError
			: InferOr<ExtractSchema<TOptions["error"]>, DefaultError>;
}

export function error<TSchema extends Schema>(
	opts: ErrorOptions.Base<TSchema> & {
		schema?: TSchema;
	}
): ErrorOptions.Base<TSchema> & {
	schema?: TSchema;
} {
	return opts;
}
