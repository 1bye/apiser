import type { Endpoint } from "./endpoint";

export interface Config {
	baseUrl: string;
	endpoints: Endpoint<any, any, any, any>[];

	/**
	 * @default json
	 */
	format?: "json";

	headers?: Record<string, string>;
	/**
	 * @default ./.openapi
	 */
	outDir?: string;
}
