import type { RawHeaders } from "@/headers";

export type ResponseTypes = "json" | "binary" | "text" | "error";

export namespace BaseResponse {
  export interface Options {
    status?: number;
    statusText?: string;
    headers?: RawHeaders;
  }

  export class Base<TPayload> extends Response {
    public payload: TPayload | undefined;

    constructor(body?: ConstructorParameters<typeof Response>[0], init?: (ResponseInit & { payload: TPayload }) | undefined) {
      const { payload, ..._init } = init ?? {};

      super(body, _init);

      this.payload = payload;
    }
  }
}
