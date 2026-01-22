import type { FunctionObject } from "@/types";
import type { Infer, Schema, ValidationType } from "@apiser/schema";

export namespace MetaOptions {
  export interface Base<TSchema extends Schema = Schema> {
    schema?: TSchema;

    default?: FunctionObject<Infer<TSchema>, never>;
    validationType?: ValidationType;
  }
}
