/** Generic record type used throughout the projection builder. */
type AnyRecord = Record<string, unknown>;

/** The result of building a select projection. */
export interface ProjectionResult {
	/** A Drizzle-compatible column map to pass into `.select()`. */
	selectMap: AnyRecord;
}

/**
 * Builds column projections for Drizzle `select()` calls.
 *
 * Resolves which columns should be included in the SQL query
 * based on user-supplied `select` and `exclude` maps.
 */
export class ProjectionBuilder {
	/**
	 * Builds a select map from a Drizzle table, optionally filtered
	 * by a `select` whitelist or an `exclude` blacklist.
	 *
	 * Priority:
	 * 1. If `select` is provided, only the listed columns are included.
	 * 2. If `exclude` is provided, all columns *except* the listed ones are included.
	 * 3. If neither is provided, all columns are included.
	 *
	 * Falls back to all columns when the filter would result in an empty map.
	 *
	 * @param table   - The Drizzle table object whose columns are introspected.
	 * @param select  - Optional whitelist: `{ columnName: true }`.
	 * @param exclude - Optional blacklist: `{ columnName: true }`.
	 * @returns A {@link ProjectionResult} containing the resolved column map.
	 */
	build(
		table: AnyRecord,
		select?: AnyRecord,
		exclude?: AnyRecord
	): ProjectionResult {
		const allColumns = this.extractColumns(table);

		if (select && typeof select === "object") {
			return this.buildFromSelect(allColumns, select);
		}

		if (exclude && typeof exclude === "object") {
			return this.buildFromExclude(allColumns, exclude);
		}

		return { selectMap: allColumns };
	}

	/**
	 * Extracts a column map for a table, including only actual Drizzle columns.
	 *
	 * Useful for building join select maps where every column of an
	 * aliased table needs to be enumerated.
	 *
	 * @param table - The Drizzle table (or aliased table) to extract from.
	 * @returns A record mapping column names to their Drizzle column references.
	 */
	extractColumns(table: AnyRecord): AnyRecord {
		const columns: AnyRecord = {};

		for (const [key, value] of Object.entries(table)) {
			if (this.isDrizzleColumn(value)) {
				columns[key] = value;
			}
		}

		return columns;
	}

	// ---------------------------------------------------------------------------
	// Private
	// ---------------------------------------------------------------------------

	/**
	 * Builds a select map by picking only the columns listed in `select`.
	 *
	 * Falls back to all columns if the resulting map is empty.
	 */
	private buildFromSelect(
		allColumns: AnyRecord,
		select: AnyRecord
	): ProjectionResult {
		const picked: AnyRecord = {};

		for (const [key, value] of Object.entries(select)) {
			if (value === true && key in allColumns) {
				picked[key] = allColumns[key];
			}
		}

		if (Object.keys(picked).length > 0) {
			return { selectMap: picked };
		}

		return { selectMap: allColumns };
	}

	/**
	 * Builds a select map by omitting columns listed in `exclude`.
	 *
	 * Falls back to all columns if everything would be excluded.
	 */
	private buildFromExclude(
		allColumns: AnyRecord,
		exclude: AnyRecord
	): ProjectionResult {
		const remaining: AnyRecord = { ...allColumns };

		for (const [key, value] of Object.entries(exclude)) {
			if (value === true) {
				delete remaining[key];
			}
		}

		if (Object.keys(remaining).length > 0) {
			return { selectMap: remaining };
		}

		return { selectMap: allColumns };
	}

	/**
	 * Checks whether a value is a Drizzle column reference.
	 *
	 * Drizzle columns expose a `.getSQL()` method used for query building.
	 */
	private isDrizzleColumn(value: unknown): boolean {
		return (
			!!value &&
			typeof value === "object" &&
			typeof (value as Record<string, unknown>).getSQL === "function"
		);
	}
}
