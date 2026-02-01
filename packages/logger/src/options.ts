import type { AnyTransport } from "./transport";

export interface LoggerOptions<TTransports extends Record<string, AnyTransport>> {
  name?: string;

  transports: TTransports;
}
