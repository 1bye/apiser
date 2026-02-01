import type { LogLevels } from "./level";
import type { LoggerOptions } from "./options";
import type { AnyTransport } from "./transport";

export interface LoggerMethods {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string | Error, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export interface Logger<TOptions extends LoggerOptions<any>> extends LoggerMethods {
  to(transportName: (keyof TOptions["transports"]) | (keyof TOptions["transports"])[]): Logger<TOptions>;
}

export function createLogger<
  TTransports extends Record<string, AnyTransport>,
  TOptions extends LoggerOptions<TTransports>
>(options: TOptions): Logger<TOptions> {
  const loggerName = options.name ?? "Logger";
  const transports = options.transports ?? {};
  const transportKeys = Object.keys(transports);
  const reservedKeys = ["to", "info", "error", "warn", "debug"];

  if (reservedKeys.some(key => transportKeys.includes(key))) {
    throw new Error(
      `${loggerName} should not include reserved transport keys: ${reservedKeys.join(", ")}`
    )
  }

  const cast = ({ level, message, data, transportKeys: _transportKeys }: {
    level: LogLevels;
    message: string;
    data?: Record<string, unknown>;

    transportKeys?: keyof TTransports;
  }) => {
    const keys = _transportKeys ?? transportKeys;


  }

  return {

  }
}
