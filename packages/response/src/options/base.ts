import type { Headers } from "@/headers";
import type { BinaryOptions } from "@/options/binary";
import type { ErrorOptions } from "@/options/error";
import type { JsonOptions } from "@/options/json";
import type { MetaOptions } from "@/options/meta";
import type { BaseResponse, ResponseTypes } from "@/response/base";
import type { Binary } from "@/response/binary";
import type { DefaultResponse } from "@/response/default";
import type { PromiseOr } from "@/types";

export interface Options<
	TMeta extends MetaOptions.Base = MetaOptions.Base,
	TError extends ErrorOptions.Base = ErrorOptions.Base,
	TJson extends JsonOptions.Base = JsonOptions.Base,
	TBinary extends BinaryOptions.Base = BinaryOptions.Base,
> {
	binary?: TBinary;
	error?: TError;
	headers?: Headers<{
		type: ResponseTypes;
		data: any;
	}>;
	json?: TJson;

	mapResponse?(data: {
		data: JsonOptions.InferedSchemaFromBase<TJson> | Binary | string;
		error: ErrorOptions.InferedSchemaFromBase<TError>;
		// headers: RawHeaders;
		// status: number | undefined;
		// statusText: string | undefined;
		response: BaseResponse.Base<DefaultResponse>;
	}): PromiseOr<Response>;

	meta?: TMeta;
}
