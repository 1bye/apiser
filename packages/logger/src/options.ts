import type { AnyTransport } from "./transport";

export type LoggerAutoFlushEvent = "beforeExit" | "SIGINT" | "SIGTERM";

export interface LoggerAutoFlushOptions {
  intervalMs?: number;
  on?: LoggerAutoFlushEvent[];
}

export interface LoggerOptions<TTransports extends Record<string, AnyTransport>> {
  name?: string;

  transports: TTransports;

  autoFlush?: LoggerAutoFlushOptions;
}
