/**
 * Represents an error that occurred during query compilation or execution.
 *
 * Extends the native `Error` class so it can be caught independently
 * from generic runtime errors.
 */
export class QueryError extends Error {
	/** Discriminator for runtime type checks. */
	readonly kind = "QueryError" as const;

	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "QueryError";
	}
}
