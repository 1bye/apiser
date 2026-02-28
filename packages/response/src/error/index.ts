import type {
	ExtractSchema,
	Infer,
	Schema,
	ValidationType,
} from "@apisr/schema";
import type { ErrorOptions, Options } from "@/options";

export * from "./default";

// Start of types ------------------

export type DefaultErrorTypes =
	| "unauthorized"
	| "forbidden"
	| "notFound"
	| "badRequest"
	| "conflict"
	| "tooMany"
	| "internal";

export type DefaultError = {
	message: string;
	code: string;
	name: string;

	cause?: unknown;
	stack?: string[];
};

type InferErrorHandlerInput<
	THandlerOptions extends ErrorHandlerOptions | undefined,
> = THandlerOptions extends {
	input: infer TSchema;
}
	? TSchema extends Schema
		? Infer<TSchema>
		: never
	: THandlerOptions extends {
				input?: infer TSchema;
			}
		? TSchema extends Schema
			? Infer<TSchema> | undefined
			: undefined
		: never;

export type ErrorHandler<
	TOptions extends Options,
	THandlerOptions extends ErrorHandlerOptions | undefined,
> = (data: {
	meta: TOptions["meta"] extends undefined
		? never
		: Infer<ExtractSchema<TOptions["meta"]>>;
	input: InferErrorHandlerInput<THandlerOptions>;
}) => ErrorOptions.InferedSchema<TOptions>;

export interface ErrorHandlerOptions<TSchema extends Schema = Schema> {
	input?: TSchema;

	status?: number;
	statusText?: string;
	validationType?: ValidationType;
}

export type ErrorDefinition<
	TOptions extends Options,
	THandlerOptions extends ErrorHandlerOptions | undefined,
> = {
	handler:
		| ErrorHandler<TOptions, THandlerOptions>
		| ErrorOptions.InferedSchema<TOptions>;
	options: THandlerOptions;
};

export type ErrorRegistry<TOptions extends Options> = Record<
	string,
	ErrorDefinition<TOptions, any>
>;

// End of types ------------------
