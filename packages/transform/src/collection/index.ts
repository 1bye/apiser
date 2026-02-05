import type { BaseTag } from "@/tags";

export namespace Collection {
  export type KeyNaming = string | KeyNamespaceNaming | KeyVersionedNaming;
  export type KeyNamespaceNaming = `${string}.${string}`;
  export type KeyVersionedNaming = `${string}.${string}@${string}`;

  export type Keys = {
    [TKey in KeyNaming]: Record<string, any>
  }

  export type Payload = Record<string, unknown>;
  export interface TransformOptions {
    from: string;
    to: string;
    explain?: boolean;
    mode?: "strict" | "warn" | "loose";
  }
  export interface TransformResult {
    value: any;
    errors: any;
    explain: any;
  }
}

export class BaseCollection<TKeys extends Collection.Keys> {
  constructor(keys: TKeys) {

  }

  transform(payload: Collection.Payload, options: Collection.TransformOptions) {

  }

  arrayOf() {

  }
}

export function collection<TKeys extends Collection.Keys>(keys: TKeys): BaseCollection<TKeys> {
  return new BaseCollection(keys);
}
