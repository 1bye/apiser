import * as stackTraceParser from "stacktrace-parser";
import type { LogLevels } from "./level";
import type { Log } from "./log";
import type { LoggerOptions } from "./options";
import type {
	AnyTransport,
	TransportFlushFn,
	TransportLogFnContext,
} from "./transport";

export type { LogLevels } from "./level";
export type { Log } from "./log";
export type {
	AnyTransport,
	Transport,
	TransportFlushFn,
	TransportLogFn,
	TransportLogFnContext,
	TransportOptions,
} from "./transport";
export { createTransport } from "./transport";

export interface LoggerMethods {
	debug(message: string, data?: Record<string, unknown>): void;
	error(message: string | Error, data?: Record<string, unknown>): void;
	info(message: string, data?: Record<string, unknown>): void;
	warn(message: string, data?: Record<string, unknown>): void;
}

export interface LoggerExtendOptions<
	TTransports extends Record<string, AnyTransport>,
> {
	excludeTransport?: (keyof TTransports)[];
	mapTransport?: (ctx: {
		name: keyof TTransports;
		transport: TTransports[keyof TTransports];
	}) => AnyTransport;
	name?: string;
}

export interface Logger<TOptions extends LoggerOptions<any>>
	extends LoggerMethods {
	extend(
		options: LoggerExtendOptions<TOptions["transports"]>
	): Logger<TOptions>;

	flush(): Promise<void>;
	to(
		transportName:
			| keyof TOptions["transports"]
			| (keyof TOptions["transports"])[]
	): Logger<TOptions>;
}

function getCallerFile(): { path: string; codeLine: string } {
	const stack = new Error().stack;

	if (!stack) {
		return { path: "unknown", codeLine: "0" };
	}

	const lines = stackTraceParser.parse(stack);
	const pwd = process?.env?.PWD ?? process.cwd() ?? "";
	const path = lines.at(-1)?.file ?? "unknown";

	return {
		path: path.replace(pwd, ""),
		codeLine: String(lines.at(-1)?.lineNumber) ?? "0",
	};
}

export function createLogger<
	TTransports extends Record<string, AnyTransport>,
	TOptions extends LoggerOptions<TTransports>,
>(options: TOptions): Logger<TOptions> {
	const baseLoggerName = options.name ?? "Logger";
	const baseTransports = options.transports ?? ({} as TTransports);
	const transportKeys = Object.keys(baseTransports);
	const reservedKeys = [
		"to",
		"info",
		"error",
		"warn",
		"debug",
		"flush",
		"extend",
	];

	if (reservedKeys.some((key) => transportKeys.includes(key))) {
		throw new Error(
			`${baseLoggerName} should not include reserved transport keys: ${reservedKeys.join(", ")}`
		);
	}

	const logsByTransport = new Map<keyof TTransports, Log[]>();

	const buildLogger = (
		activeTransportKeys?: (keyof TTransports)[]
	): Logger<TOptions> => {
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
			const keys =
				_transportKeys ??
				activeTransportKeys ??
				(transportKeys as (keyof TTransports)[]);
			const file = getCallerFile();

			const log: Log = {
				timestamp: Date.now(),
				level,
				message,
				data: data ?? {},
			};

			for (const key of keys) {
				const transport = baseTransports[key];
				if (!transport) {
					continue;
				}

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

			to(
				transportName:
					| keyof TOptions["transports"]
					| (keyof TOptions["transports"])[]
			) {
				const keys = (
					Array.isArray(transportName) ? transportName : [transportName]
				) as (keyof TTransports)[];
				return buildLogger(keys);
			},

			async flush(): Promise<void> {
				const keys =
					activeTransportKeys ?? (transportKeys as (keyof TTransports)[]);

				await Promise.all(
					keys.map(async (key) => {
						const transport = baseTransports[key];
						if (!transport) {
							return;
						}
						if (!transport.flush) {
							return;
						}

						const logs = logsByTransport.get(key) ?? [];
						await (transport.flush as TransportFlushFn)({
							store: transport.store,
							logs,
						});
						logsByTransport.set(key, []);
					})
				);
			},

			extend(
				extendOptions: LoggerExtendOptions<TTransports>
			): Logger<TOptions> {
				const excluded = new Set<keyof TTransports>(
					extendOptions.excludeTransport ?? []
				);

				const mapped = {} as TTransports;
				for (const key of transportKeys as (keyof TTransports)[]) {
					if (excluded.has(key)) {
						continue;
					}

					const base = baseTransports[key];
					mapped[key] = (
						extendOptions.mapTransport
							? (extendOptions.mapTransport({
									name: key,
									transport: base,
								}) as TTransports[keyof TTransports])
							: base
					) as TTransports[keyof TTransports];
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

	const logger = buildLogger();

	const autoFlush = options.autoFlush;
	if (autoFlush) {
		let timer: ReturnType<typeof setInterval> | undefined;

		if (typeof autoFlush.intervalMs === "number" && autoFlush.intervalMs > 0) {
			timer = setInterval(() => {
				logger.flush();
			}, autoFlush.intervalMs);
		}

		const events = autoFlush.on ?? [];
		const listeners: Array<{ event: string; handler: () => void }> = [];

		const attach = (event: string, handler: () => void) => {
			try {
				process.on(event as any, handler);
				listeners.push({ event, handler });
			} catch {
				// ignore (non-node env)
			}
		};

		if (events.includes("beforeExit")) {
			attach("beforeExit", () => {
				logger.flush();
			});
		}

		if (events.includes("SIGINT")) {
			attach("SIGINT", () => {
				logger.flush();
			});
		}

		if (events.includes("SIGTERM")) {
			attach("SIGTERM", () => {
				logger.flush();
			});
		}

		const cleanup = () => {
			if (timer) {
				clearInterval(timer);
				timer = undefined;
			}

			for (const { event, handler } of listeners) {
				try {
					process.off(event as any, handler);
				} catch {
					// ignore
				}
			}
		};

		// If process is exiting anyway, avoid leaving intervals/handlers behind.
		// Note: cleanup doesn't call flush; handlers already do.
		if (events.length > 0 || timer) {
			try {
				process.on("exit", cleanup);
			} catch {
				// ignore
			}
		}
	}

	return logger;
}
