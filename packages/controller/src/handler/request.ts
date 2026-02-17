export interface HandlerRequest {
	/**
	 * Body from request. Depends on framework used,
	 * but can be as FormData (mostly for Files), and text (depends on schema).
	 */
	body: FormData | string;

	/**
	 * Headers from request.
	 */
	headers: Record<string, string | undefined>;

	/**
	 * URL params from request url.
	 * Ex: /v1/cars/:id/info -> /v1/cars/1/info -> id:1
	 */
	params: Record<string, any>;

	/**
	 * Query params from request url.
	 * Can be like a string, like a string...
	 */
	query: Record<string, any>;
	url: string;
}
