import type { AnyResponseHandler } from "@apiser/response";
import type { FromKey } from "@apiser/zod";

export interface ModelIdentifier {
  $model: any;
  $modelName: any;
  $$config: any;
}

export type BindingModelContext<
  TModel extends ModelIdentifier,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TPrimaryKey extends string = string
> = {
  [TKey in TPrimaryKey]: TModel["$$config"]["primaryKeysWithDataType"][TKey]
} & Pick<
  Exclude<TResponseHandler, undefined>,
  "fail"
>;

export type ResolveBindingModel<TOptions extends BindingModelOptions<any>> =
  TOptions["load"] extends undefined
  ? (TOptions extends BindingModelOptions<infer TModel, any, any>
    ? TModel
    : never)
  : ReturnType<Exclude<TOptions["load"], undefined>>

export interface BindingModelOptions<
  TModel extends ModelIdentifier,
  TResponseHandler extends AnyResponseHandler | undefined = AnyResponseHandler | undefined,
  TPrimaryKey extends TModel["$$config"]["primaryKeys"] | "id" = "id",
> {
  /**
   * @default "id"
   */
  primaryKey?: TPrimaryKey;

  /**
   * @default "params"
   */
  from?: FromKey;

  /**
   * @default taken from model.name
   */
  fromKey?: string | TModel["$modelName"];

  /**
   *
   */
  where?: TModel["$$config"]["whereValue"];

  /**
   *
   * @returns
   */
  transform?: () => any;

  load?: <TLoadModel extends ModelIdentifier>(ctx: BindingModelContext<
    TModel,
    TResponseHandler,
    TPrimaryKey
  >) => TLoadModel;

  notFound?: (ctx: BindingModelContext<
    TModel,
    TResponseHandler,
    TPrimaryKey
  >) => void;
}
