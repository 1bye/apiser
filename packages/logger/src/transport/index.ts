import { createStore, type Store } from "./store";
import type { Log } from "@/log";

export interface TransportLogFnContext extends Log {
  file: {
    path: string;
    codeLine: string;
  };

  store: Store;
}

export interface TransportLogFn {
  (ctx: TransportLogFnContext): void;
}

export interface TransportFlushFn {
  (ctx: Pick<TransportLogFnContext, "store"> & {
    logs: Log[];
  }): PromiseLike<void> | void;
}

export interface TransportOptions {
  log: TransportLogFn;

  flush?: TransportFlushFn;
}

export interface Transport<TOptions extends TransportOptions> {
  store: Store;

  log: TOptions["log"];
  flush: TOptions["flush"];
}

export type AnyTransport = Transport<any>;

export function createTransport<
  TOptions extends TransportOptions
>(options: TOptions): Transport<TOptions> {
  const store = createStore();

  return {
    store,

    log: options.log,
    flush: options.flush
  }
}
