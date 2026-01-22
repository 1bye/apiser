import type { Options } from "./options";
import type { ExtractSchema, InferOr } from "@apiser/schema";

export type DefaultMeta = {
  requestId: string;
  timestamp: number;
}

export type MetaOptionsInferedSchema<TOptions extends Options> = (TOptions["meta"] extends undefined
  ? DefaultMeta
  : InferOr<ExtractSchema<TOptions["error"]>, DefaultMeta>);
