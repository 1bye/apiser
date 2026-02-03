import type { Schema } from "@apiser/schema";
import { z } from "@apiser/zod";

export namespace Tag {
  export interface Config {
    schema: Schema;
    deriveData?: Record<string, unknown>;
    deriveCallback?: Derive.Callback<Record<string, unknown>, unknown>;
    deriveOptions?: Derive.Options;
  }

  export namespace Derive {
    export interface Callback<TData, TDataType> {
      (tags: TData): TDataType;
    }

    export interface Options {
      when: "always" | "missing";
    }
  }
}

export class BaseTag<
  TDataType extends any = any,
> {
  _config: Tag.Config;
  _dataType: TDataType;

  constructor(config?: Tag.Config) {
    this._config = config ?? {
      schema: z.unknown(),
      deriveCallback: undefined,
      deriveData: {},
    };

    // Only used for easier inferrence in types.
    this._dataType = undefined as TDataType;
  }

  string(): BaseTag<string> {
    return new BaseTag<string>({
      schema: z.string()
    });
  }

  number(): BaseTag<number> {
    return new BaseTag<number>({
      schema: z.number()
    });
  }

  derive(callback: Tag.Derive.Callback<Record<string, unknown>, TDataType>, options?: Tag.Derive.Options): BaseTag {
    return new BaseTag({
      ...this._config,
      deriveCallback: callback,
      deriveOptions: options
    });
  }
}
