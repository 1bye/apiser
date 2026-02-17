import type { Log } from "@/log";
import { createStore, type Store } from "./store";

export interface TransportLogFnContext extends Log {
	file: {
		path: string;
		codeLine: string;
	};

	store: Store;
}

export type TransportLogFn = (ctx: TransportLogFnContext) => void;

export type TransportFlushFn = (
	ctx: Pick<TransportLogFnContext, "store"> & {
		logs: Log[];
	}
) => PromiseLike<void> | void;

export interface TransportOptions {
	flush?: TransportFlushFn;
	log: TransportLogFn;
}

export interface Transport<TOptions extends TransportOptions> {
	flush: TOptions["flush"];

	log: TOptions["log"];
	store: Store;
}

export type AnyTransport = Transport<any>;

export function createTransport<TOptions extends TransportOptions>(
	options: TOptions
): Transport<TOptions> {
	const store = createStore();

	return {
		store,

		log: options.log,
		flush: options.flush,
	};
}
