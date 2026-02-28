/** Generic record type used throughout the transformer. */
type AnyRecord = Record<string, unknown>;

/**
 * Applies post-query transformations to result sets.
 *
 * Handles three independent transformations that can be composed:
 * - **select** — whitelist specific fields from the result.
 * - **exclude** — blacklist specific fields from the result.
 * - **format** — run a user-defined formatting function over each row.
 *
 * Each method is safe to call on `null`, `undefined`, arrays, and
 * single objects, and recurses correctly into nested structures.
 */
export class ResultTransformer {
	/**
	 * Picks only the fields present in the `select` map from each row.
	 *
	 * Supports nested selection: when a select value is an object instead
	 * of `true`, it recurses into that nested structure.
	 *
	 * @param value  - The query result (single row, array, or nullish).
	 * @param select - A map of `{ fieldName: true | nestedSelect }`.
	 * @returns The filtered result with the same shape (single / array).
	 */
	applySelect(value: unknown, select: AnyRecord): unknown {
		if (value == null) {
			return value;
		}
		if (Array.isArray(value)) {
			return value.map((item) => this.applySelect(item, select));
		}
		if (typeof value !== "object") {
			return value;
		}

		const row = value as AnyRecord;
		const out: AnyRecord = {};

		for (const [key, sel] of Object.entries(select)) {
			if (sel === true) {
				out[key] = row[key];
				continue;
			}
			if (sel && typeof sel === "object") {
				out[key] = this.applySelect(row[key], sel as AnyRecord);
			}
		}

		return out;
	}

	/**
	 * Removes the fields present in the `exclude` map from each row.
	 *
	 * Supports nested exclusion: when an exclude value is an object,
	 * it recurses into the nested value instead of removing the key entirely.
	 *
	 * @param value   - The query result (single row, array, or nullish).
	 * @param exclude - A map of `{ fieldName: true | nestedExclude }`.
	 * @returns The result with excluded fields removed.
	 */
	applyExclude(value: unknown, exclude: AnyRecord): unknown {
		if (value == null) {
			return value;
		}
		if (Array.isArray(value)) {
			return value.map((item) => this.applyExclude(item, exclude));
		}
		if (typeof value !== "object") {
			return value;
		}

		const row = value as AnyRecord;
		const out: AnyRecord = { ...row };

		for (const [key, ex] of Object.entries(exclude)) {
			if (ex === true) {
				delete out[key];
				continue;
			}
			if (ex && typeof ex === "object" && key in out) {
				out[key] = this.applyExclude(out[key], ex as AnyRecord);
			}
		}

		return out;
	}

	/**
	 * Applies a user-defined format function to each row in the result.
	 *
	 * When the format function is `undefined` or `null`, the value is
	 * returned unchanged. Arrays are mapped element-by-element.
	 *
	 * @param value  - The query result (single row, array, or nullish).
	 * @param format - A function that transforms a single row, or `undefined`.
	 * @returns The formatted result.
	 */
	applyFormat(
		value: unknown,
		format: ((row: AnyRecord) => unknown) | undefined
	): unknown {
		if (!format) {
			return value;
		}
		if (value == null) {
			return value;
		}
		if (Array.isArray(value)) {
			return value.map((item) => this.applyFormat(item, format));
		}
		if (typeof value !== "object") {
			return value;
		}

		return format(value as AnyRecord);
	}
}
