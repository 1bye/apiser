import type { Headers } from "@/headers";
import type { Binary } from "@/response/binary";

export namespace BinaryOptions {
  export interface Base {
    headers?: Headers<Binary>;

    onData?: (data: Binary) => Binary;
  }
}

export function binary<T extends BinaryOptions.Base>(opts: T): T {
  return opts;
}
