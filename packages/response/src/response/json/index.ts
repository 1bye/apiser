import type { BaseResponse } from "../base";

export namespace JsonResponse {
  export class Base<TInput, TOutput> extends Response {
    private _input: TInput | undefined;
    private _output: TOutput | undefined;

    constructor(body: ConstructorParameters<typeof Response>[0], _init?: ConstructorParameters<typeof Response>[1] & {
      input: TInput;
      output: TOutput;
    }) {
      const { input, output, ...init } = _init ?? {};

      super(body, init);

      this._input = input;
      this._output = output;
    }

    get input(): TInput | undefined {
      return this._input;
    }

    get output(): TOutput | undefined {
      return this._output;
    }
  }
  // export type Base = Record<string, any> & {
  //   [responseSymbol]: () => Response;
  // }

  export interface Options extends BaseResponse.Options {
  }

  export type DefaultInputSchema = Record<string, any>;
  export type DefaultOutputSchema = {
    data: Record<string, any>;
    success: boolean;
  };

  export function defaultOnDataOutput(input: DefaultInputSchema): DefaultOutputSchema {
    return {
      data: input,
      success: true
    }
  }
}
