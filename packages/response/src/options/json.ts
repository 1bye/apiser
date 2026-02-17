import type {
	ExtractSchema,
	Infer,
	InferOr,
	Schema,
	ValidationType,
} from "@apisr/schema";
import type { Headers } from "@/headers";
import type { JsonResponse } from "@/response/json";
import type { PromiseOr } from "@/types";
import type { Options } from "./base";

export namespace JsonOptions {
	export interface Base<TSchema extends Schema = Schema> {
		headers?: Headers<Infer<TSchema>>;

		mapData?: (data: Infer<TSchema>) => PromiseOr<Infer<TSchema>>;

		schema?: TSchema;
		validationType?: ValidationType;
	}

	export type InferedSchemaFromBase<TJson extends Base> = InferOr<
		ExtractSchema<TJson>,
		JsonResponse.DefaultSchema
	>;

	// export type InferedInputSchema<TOptions extends Options> = (TOptions["json"] extends undefined
	//   ? JsonResponse.DefaultInputSchema
	//   : InferOr<Exclude<ExtractSchemaFromKey<TOptions["json"], "inputSchema">, undefined>, JsonResponse.DefaultInputSchema>);

	export type InferedSchema<TOptions extends Options> =
		TOptions["json"] extends undefined
			? JsonResponse.DefaultSchema
			: InferOr<
					Exclude<ExtractSchema<TOptions["json"]>, undefined>,
					JsonResponse.DefaultSchema
				>;
}

export function json<TSchema extends Schema>(
	opts: JsonOptions.Base<TSchema>
): JsonOptions.Base<TSchema> {
	return opts;
}
