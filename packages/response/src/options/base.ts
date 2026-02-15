import type { MetaOptions } from "@/options/meta";
import type { ErrorOptions } from "@/options/error";
import type { JsonOptions } from "@/options/json";
import type { BinaryOptions } from "@/options/binary";
import type { Headers } from "@/headers";
import type { BaseResponse, ResponseTypes } from "@/response/base";
import type { Binary } from "@/response/binary";
import type { PromiseOr } from "@/types";
import type { DefaultResponse } from "@/response/default";

export interface Options<
  TMeta extends MetaOptions.Base = MetaOptions.Base,
  TError extends ErrorOptions.Base = ErrorOptions.Base,
  TJson extends JsonOptions.Base = JsonOptions.Base,
  TBinary extends BinaryOptions.Base = BinaryOptions.Base
> {
  headers?: Headers<{
    type: ResponseTypes;
    data: any;
  }>;

  meta?: TMeta;
  error?: TError;
  json?: TJson;

  binary?: TBinary;

  mapResponse?(data: {
    data: JsonOptions.InferedSchemaFromBase<TJson> | Binary | string;
    error: ErrorOptions.InferedSchemaFromBase<TError>;
    // headers: RawHeaders;
    // status: number | undefined;
    // statusText: string | undefined;
    response: BaseResponse.Base<DefaultResponse>;
  }): PromiseOr<Response>;
}
