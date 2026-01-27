import type { FromKey } from "@apiser/zod";

export interface ModelIdentifier {
  $model: any;
  $modelName: any;
  $$config: any;
}

export interface BindingModelOptions<TModel extends ModelIdentifier> {
  primaryKey?: TModel["$$config"]["primaryKeys"];
  from?: FromKey;
  fromKey?: string | TModel["$modelName"];
  where?: TModel["$$config"]["whereValue"];
  transform?: () => any;
}
