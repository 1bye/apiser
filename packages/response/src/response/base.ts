import type { RawHeaders } from "@/headers";

export type ResponseTypes = "json" | "binary" | "text" | "error";

export namespace BaseResponse {
  export interface Options {
    status?: number;
    statusText?: string;
    headers?: RawHeaders;
  }
}
