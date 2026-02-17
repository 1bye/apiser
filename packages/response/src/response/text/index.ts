import type { BaseResponse } from "../base";

export namespace TextResponse {
	export class Base extends Response {}

	export interface Options extends BaseResponse.Options {}
}
