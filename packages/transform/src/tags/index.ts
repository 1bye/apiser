import type { Infer, Schema } from "@apiser/schema";
import { z } from "@apiser/zod";

export namespace Tag {
  export interface Config<
    TDataType extends any = any,
  > {
    schema: Schema;
    required?: boolean;
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
