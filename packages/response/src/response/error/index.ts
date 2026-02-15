import type { BaseResponse } from "../base";

export namespace ErrorResponse {
  export class Base<
    TName extends string,
    TMeta extends Record<string, any>,
    TOutput extends Record<string, any>
  > extends Error {
    public override name: TName;
    public meta: TMeta;
    public output: TOutput;
    public status: number;
    public statusText: string;

    constructor({ meta, name, output, status, statusText }: {
      // Name of error in response handler
      name: TName;

      // Meta of response
      meta: TMeta;

      // Output of handler
      output: TOutput;

      status: number;
      statusText: string;
    }) {
      super();

      this.status = status;
      this.statusText = statusText;

      this.name = name;
      this.meta = meta;
      this.output = output;
    }
  }


  export interface Options extends BaseResponse.Options {
  }
}
