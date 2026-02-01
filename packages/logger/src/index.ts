import type { LogLevels } from "./level";
import type { Log } from "./log";
import type { LoggerOptions } from "./options";
import type { AnyTransport } from "./transport";
import type { TransportFlushFn, TransportLogFnContext } from "./transport";

export { createTransport } from "./transport";
export type {
  AnyTransport,
  Transport,
  TransportOptions,
  TransportLogFn,
  TransportLogFnContext,
  TransportFlushFn,
} from "./transport";

export type { LogLevels } from "./level";
export type { Log } from "./log";

export interface LoggerMethods {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string | Error, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export interface LoggerExtendOptions<
  TTransports extends Record<string, AnyTransport>,
> {
  name?: string;
  excludeTransport?: (keyof TTransports)[];
  mapTransport?: (ctx: {
    name: keyof TTransports;
    transport: TTransports[keyof TTransports];
  }) => AnyTransport;
}

export interface Logger<TOptions extends LoggerOptions<any>> extends LoggerMethods {
  to(transportName: (keyof TOptions["transports"]) | (keyof TOptions["transports"])[]): Logger<TOptions>;

  flush(): Promise<void>;

  extend(options: LoggerExtendOptions<TOptions["transports"]>): Logger<TOptions>;
}

function getCallerFile(): { path: string; codeLine: string } {
  const stack = new Error().stack;

  if (!stack) {
    return { path: "unknown", codeLine: "0" };
  }

  const lines = stack.split("\n").slice(1);

  for (const line of lines) {
    // Skip logger internals
    if (line.includes("/packages/logger/") || line.includes("@apiser/logger")) {
      continue;
    }

    // Example formats:
    //  at /path/to/file.ts:10:5
    //  at fn (/path/to/file.ts:10:5)
    const match = line.match(/\(?(.+):(\d+):(\d+)\)?$/);

    if (match) {
      return { path: match[1] ?? "unknown", codeLine: match[2] ?? "0" };
    }
  }

  return { path: "unknown", codeLine: "0" };
}

export function createLogger<
  TTransports extends Record<string, AnyTransport>,
  TOptions extends LoggerOptions<TTransports>
>(options: TOptions): Logger<TOptions> {
  const baseLoggerName = options.name ?? "Logger";
  const baseTransports = options.transports ?? ({} as TTransports);
  const transportKeys = Object.keys(baseTransports);
  const reservedKeys = ["to", "info", "error", "warn", "debug", "flush", "extend"];

  if (reservedKeys.some(key => transportKeys.includes(key))) {
    throw new Error(
      `${baseLoggerName} should not include reserved transport keys: ${reservedKeys.join(", ")}`
    );
  }

  const logsByTransport = new Map<keyof TTransports, Log[]>();

  const buildLogger = (activeTransportKeys?: (keyof TTransports)[]): Logger<TOptions> => {
    const cast = ({
      level,
      message,
      data,
      transportKeys: _transportKeys,
    }: {
      level: LogLevels;
      message: string;
      data?: Record<string, unknown>;
      transportKeys?: (keyof TTransports)[];
    }) => {
      const keys = _transportKeys ?? activeTransportKeys ?? (transportKeys as (keyof TTransports)[]);
      const file = getCallerFile();

      const log: Log = {
        timestamp: Date.now(),
        level,
        message,
        data: data ?? {},
      };

      for (const key of keys) {
        const transport = baseTransports[key];
        if (!transport) continue;

        const existing = logsByTransport.get(key) ?? [];
        logsByTransport.set(key, [...existing, log]);

        const ctx: TransportLogFnContext = {
          ...log,
          file,
          store: transport.store,
        };

        transport.log(ctx);
      }
    };

    const logger: Logger<TOptions> = {
      info(message: string, data?: Record<string, unknown>) {
        cast({ level: "info", message, data });
      },

      warn(message: string, data?: Record<string, unknown>) {
        cast({ level: "warn", message, data });
      },

      debug(message: string, data?: Record<string, unknown>) {
        cast({ level: "debug", message, data });
      },

      error(message: string | Error, data?: Record<string, unknown>) {
        if (message instanceof Error) {
          cast({
            level: "error",
            message: message.message,
            data: {
              ...(data ?? {}),
              stack: message.stack,
              name: message.name,
            },
          });
          return;
        }

        cast({ level: "error", message, data });
      },

      to(transportName: (keyof TOptions["transports"]) | (keyof TOptions["transports"])[]) {
        const keys = (Array.isArray(transportName) ? transportName : [transportName]) as (keyof TTransports)[];
        return buildLogger(keys);
      },

      async flush(): Promise<void> {
        const keys = activeTransportKeys ?? (transportKeys as (keyof TTransports)[]);

        await Promise.all(
          keys.map(async (key) => {
            const transport = baseTransports[key];
            if (!transport) return;
            if (!transport.flush) return;

            const logs = logsByTransport.get(key) ?? [];
            await (transport.flush as TransportFlushFn)({ store: transport.store, logs });
            logsByTransport.set(key, []);
          })
        );
      },

      extend(extendOptions: LoggerExtendOptions<TTransports>): Logger<TOptions> {
        const excluded = new Set<keyof TTransports>(extendOptions.excludeTransport ?? []);

        const mapped = {} as TTransports;
        for (const key of transportKeys as (keyof TTransports)[]) {
          if (excluded.has(key)) continue;

          const base = baseTransports[key];
          mapped[key] = (extendOptions.mapTransport
            ? (extendOptions.mapTransport({ name: key, transport: base }) as TTransports[keyof TTransports])
            : base) as TTransports[keyof TTransports];
        }

        return createLogger({
          ...(options as any),
          name: extendOptions.name ?? options.name,
          transports: mapped,
        });
      },
    };

    return logger;
  };

  return buildLogger();
}
