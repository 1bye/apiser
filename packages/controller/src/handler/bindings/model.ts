import type { AnyResponseHandler } from "@apisr/response";
import type { FromKey } from "@apisr/zod";
import type { PromiseOr } from "@/types";

export interface ModelIdentifier {
	$$config: any;
	$model: any;
	$modelName: any;
}

export type BindingModelContext<
	TModel extends ModelIdentifier,
	TResponseHandler extends AnyResponseHandler | undefined =
		| AnyResponseHandler
		| undefined,
	TPrimaryKey extends string = string,
> = {
	[TKey in TPrimaryKey]: TModel["$$config"]["primaryKeysWithDataType"][TKey];
} & Pick<Exclude<TResponseHandler, undefined>, "fail">;

export type ResolveBindingModel<TOptions extends BindingModelOptions<any>> =
	TOptions["load"] extends undefined
		? TOptions extends BindingModelOptions<infer TModel, any, any>
			? TModel
			: never
		: ReturnType<Exclude<TOptions["load"], undefined>>;

export interface BindingModelOptions<
	TModel extends ModelIdentifier,
	TResponseHandler extends AnyResponseHandler | undefined =
		| AnyResponseHandler
		| undefined,
	TPrimaryKey extends TModel["$$config"]["primaryKeys"] | "id" = "id",
> {
	/**
	 * @default "params"
	 */
	from?: FromKey;

	/**
	 * @default taken from model.name
	 */
	fromKey?: string | TModel["$modelName"];

	load?: <TLoadModel extends ModelIdentifier>(
		ctx: BindingModelContext<TModel, TResponseHandler, TPrimaryKey>
	) => PromiseOr<TLoadModel>;

	notFound?: (
		ctx: BindingModelContext<TModel, TResponseHandler, TPrimaryKey>
	) => PromiseOr<void>;
	/**
	 * @default "id"
	 */
	primaryKey?: TPrimaryKey;

	/**
	 *
	 * @returns
	 */
	transform?: () => any;

	/**
	 *
	 */
	where?: TModel["$$config"]["whereValue"];
}
