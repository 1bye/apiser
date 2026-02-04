import { BaseTag, type Tag } from "./tags";

export namespace Registry {
  export type Data = (tag: BaseTag) => any;

  export type Tags = Record<string, BaseTag>;

  export interface Collection<TTags extends Record<string, any>> {
    <TKey extends keyof TTags>(name: TKey): TTags[TKey];

    derive<
      TName extends string,
      TTagValues extends DeriveTagsValues<TTags>,
      TCallback extends Derive.Callback<TName, TTagValues>
    >(name: TName, cb: TCallback, options?: Derive.Options): Collection<TTags & {
      [TKey in TName]: BaseTag<ReturnType<TCallback>>
    }>;
  }

  export type DeriveTagsValues<TTags extends Tags> = {
    [TKey in keyof TTags]: TTags[TKey]["_dataType"];
  }

  export namespace Derive {
    export interface Callback<TName extends string, TData extends Record<string, any>> {
      (tags: TData): TData[TName];
    }

    export interface Options {
      when: "always" | "missing";
    }
  }
}

export function registry<
  TRawData extends Registry.Data,
  TTags extends ReturnType<TRawData>,
>(
  data: TRawData
): Registry.Collection<TTags> {
  const _data = typeof data === "function"
    ? data(new BaseTag())
    : data;

  const collection: Omit<Registry.Collection<TTags>, "derive"> = function <TKey extends keyof TTags>(name: TKey) {
    const baseTag = (_data as TTags)[name];

    if (!baseTag) {
      throw new Error(`Tag with name '${name as string}' is not found.`);
    }

    return baseTag;
  };

  // @ts-ignore
  collection.prototype.derive = function (name, callback) {
    throw new Error("Derive is still not developed.")
  }

  return collection as Registry.Collection<TTags>;
}
