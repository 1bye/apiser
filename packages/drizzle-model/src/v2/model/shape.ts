import type { ModelConfig } from "./config";
import type { ModelBase, ModelIdentifier } from "./model";
import type { ResolveOptionsMethods } from "./options";

export type ModelShape<TConfig extends ModelConfig> =
  ModelIdentifier<TConfig["table"]["name"]> &
  ModelBase<TConfig> &
  ResolveOptionsMethods<TConfig["options"]["methods"]>;
