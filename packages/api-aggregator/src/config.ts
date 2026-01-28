import type { Endpoint } from "./endpoint";

export interface Config {
  baseUrl: string;
  endpoints: Endpoint<any, any, any, any>[];
  /**
   * @default ./.openapi
   */
  outDir?: string;

  headers?: Record<string, string>;

  /**
   * @default json
   */
  format?: "json";
}
