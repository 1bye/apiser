import type { MetaOptions } from "@/options/meta";
import type { ErrorOptions } from "@/options/error";
import type { JsonOptions } from "@/options/json";
import type { BinaryOptions } from "@/options/binary";
import type { Headers } from "@/headers";
import type { ResponseTypes } from "@/response";

export interface Options<TMeta extends MetaOptions.Base = MetaOptions.Base> {
  headers?: Headers<{
    type: ResponseTypes;
    data: any;
  }>;

  meta?: TMeta;
  error?: ErrorOptions.Base;
  json?: JsonOptions.Base;

  binary?: BinaryOptions.Base;
}
