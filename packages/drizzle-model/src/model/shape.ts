import type { ModelConfig } from "./config.ts";
import type { ModelBase, ModelIdentifier } from "./model.ts";
import type { ResolveOptionsMethods } from "./options.ts";

export type ModelShape<TConfig extends ModelConfig> = ModelIdentifier<
	TConfig["table"]["name"]
> &
	ModelBase<TConfig> &
	ResolveOptionsMethods<TConfig["options"]["methods"]>;
