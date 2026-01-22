import type { Binary } from "@/binary";
import type { Headers } from "@/headers";

export namespace BinaryOptions {
  export interface Base {
    headers?: Headers<Binary>;

    onData: (data: Binary) => Binary;
  }
}
