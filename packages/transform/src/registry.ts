import { BaseTag, type Tag } from "./tags";

export namespace Registry {
  export type Data<TTags extends Tags> = (tag: RegistryTag<TTags>) => Tags;

  export type Tags = Record<string, BaseTag>;

  export type Collection<TTags extends Record<string, any>> = <TKey extends keyof TTags>(name: TKey) => TTags[TKey];

  export type DeriveTags<TTags extends Tags> = {
    [TKey in keyof TTags]: TTags[TKey]["_dataType"];
  }

  export interface TagConfig extends Tag.Config {
    deriveCallback?: Tag.Derive.Callback<DeriveTags<any>, any>;
  }
}

export class RegistryTag<TTags extends Record<string, any>, TDataType extends any = any> extends BaseTag<TDataType> {
  constructor(config?: Registry.TagConfig) {
    super(config)
  }

  override derive(callback: Tag.Derive.Callback<Registry.DeriveTags<TTags>, TDataType>, options?: Tag.Derive.Options): RegistryTag<TTags, TDataType> {
    return new RegistryTag<TTags, TDataType>({
      ...this._config,
      deriveCallback: callback,
      deriveOptions: options
    });
  }
}

export function registry<
  TRawData extends Registry.Data<TTags>,
  TTags extends ReturnType<TRawData>
>(
  data: TRawData
): Registry.Collection<TTags> {
  const _data = typeof data === "function"
    ? data(new RegistryTag())
    : data;

  return <TKey extends keyof TTags>(name: TKey) => {
    const baseTag = (_data as TTags)[name];

    if (!baseTag) {
      throw new Error(`Tag with name '${name as string}' is not found.`);
    }

    return baseTag;
  }
}
