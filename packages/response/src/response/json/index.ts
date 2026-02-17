import type { BaseResponse } from "../base";

export namespace JsonResponse {
	export class Base<TOutput> extends Response {
		private _output: TOutput | undefined;

		constructor(
			body: ConstructorParameters<typeof Response>[0],
			_init?: ConstructorParameters<typeof Response>[1] & {
				output: TOutput;
			}
		) {
			const { output, ...init } = _init ?? {};

			super(body, init);

			this._output = output;
		}

		get output(): TOutput | undefined {
			return this._output;
		}

		override json: () => Promise<TOutput> = () => {
			return Response.prototype.json.call(this) as Promise<TOutput>;
		};
	}
	// export type Base = Record<string, any> & {
	//   [responseSymbol]: () => Response;
	// }

	export interface Options extends BaseResponse.Options {}

	export type DefaultInputSchema = Record<string, any>;
	export type DefaultSchema = {
		data: Record<string, any>;
		success: boolean;
	};

	export function defaultOnDataOutput(
		input: DefaultInputSchema
	): DefaultSchema {
		return {
			data: input,
			success: true,
		};
	}
}
