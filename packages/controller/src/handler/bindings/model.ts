export interface ModelIdentifier {
  $model: any;
}

export interface ModelConfig {
  primaryKeys: string;
};
export type InferModelConfig<TModel extends Model<any>> =
  TModel extends Model<infer TModelConfig>
  ? (TModelConfig extends ModelConfig
    ? TModelConfig
    : never)
  : never;

export interface Model<TConfig extends ModelConfig> extends ModelIdentifier { }

export interface BindingModelOptions<TModel extends Model<any>, TModelConfig extends InferModelConfig<TModel> = InferModelConfig<TModel>> {
  primaryKey?: TModelConfig["primaryKeys"]
}
