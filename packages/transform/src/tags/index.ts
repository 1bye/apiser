import type { Infer, Schema } from "@apiser/schema";
import { z } from "@apiser/zod";

export namespace Tag {
  export interface Config<
    TDataType extends any = any,
  > {
    schema: Schema;
    required?: boolean;
  }

  /**
   * StringTag namespace
   */
  export namespace String {
    export interface Config<
      TDataType extends string = string,
    > extends Tag.Config<TDataType> {
      maxLength?: number;
      minLength?: number;
    }
  }
}

export class BaseTag<
  TDataType extends any = any,
> {
  _config: Tag.Config<TDataType>;
  _dataType: TDataType;

  constructor(config?: Tag.Config<TDataType>) {
    this._config = config ?? {
      schema: z.unknown(),
    };

    // Only used for easier inferrence in types.
    this._dataType = undefined as TDataType;
  }

  string(): StringTag<string> {
    return new StringTag<string>({
      schema: z.string()
    });
  }

  number(): BaseTag<number> {
    return new BaseTag<number>({
      schema: z.number()
    });
  }

  required(): BaseTag<TDataType> {
    return new BaseTag<TDataType>({
      ...this._config,
      required: true
    });
  }

  schema<TSchema extends Schema>(schema: TSchema): BaseTag<Infer<TSchema>> {
    return new BaseTag<Infer<TSchema>>({
      ...this._config,
    });
  }
}

export class StringTag<TDataType extends string = string> extends BaseTag<TDataType> {
  constructor(config: Tag.String.Config<TDataType>) {
    super(config);
  }

  max(length: number): StringTag<TDataType> {
    return new StringTag({
      ...this._config,
      maxLength: length
    });
  }

  min(length: number): StringTag<TDataType> {
    return new StringTag({
      ...this._config,
      minLength: length
    });
  }
}
