import type { BaseResponse } from "../base";

export type Binary = Blob | ArrayBuffer | Uint8Array | ReadableStream;

export namespace BinaryResponse {
	export class Base extends Response {}

	export interface Options extends BaseResponse.Options {}
}
