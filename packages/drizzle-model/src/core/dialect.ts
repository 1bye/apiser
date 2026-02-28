import type { ModelDialect } from "../model/dialect.ts";

/** Alias for a generic record with string keys. */
type AnyRecord = Record<string, unknown>;

/**
 * Encapsulates dialect-specific logic for different SQL databases.
 *
 * Provides helpers for determining returning-id behaviour and
 * lazily importing the correct Drizzle `alias()` function based on the dialect.
 */
export class DialectHelper {
	/** The dialect string identifying the target database engine. */
	readonly dialect: ModelDialect;

	constructor(dialect: ModelDialect) {
		this.dialect = dialect;
	}

	/**
	 * Returns `true` when the dialect only supports `$returningId()`
	 * instead of the standard `.returning()` method.
	 *
	 * Applies to MySQL, SingleStore and CockroachDB.
	 */
	isReturningIdOnly(): boolean {
		return (
			this.dialect === "MySQL" ||
			this.dialect === "SingleStore" ||
			this.dialect === "CockroachDB"
		);
	}

	/**
	 * Creates a table alias using the dialect-specific Drizzle module.
	 *
	 * Dynamically imports the correct `alias` utility so the core
	 * does not carry a hard dependency on every dialect.
	 *
	 * @param table - The Drizzle table object to alias.
	 * @param aliasName - The SQL alias name.
	 * @returns The aliased table, or the original table if aliasing is unavailable.
	 */
	async createTableAlias(
		table: AnyRecord,
		aliasName: string
	): Promise<AnyRecord> {
		const modulePath = this.getDialectModulePath();
		if (!modulePath) {
			return table;
		}

		const mod: AnyRecord = await import(modulePath);
		if (typeof mod.alias === "function") {
			return (mod.alias as (t: AnyRecord, name: string) => AnyRecord)(
				table,
				aliasName
			);
		}

		return table;
	}

	/**
	 * Resolves the Drizzle ORM module path for the current dialect.
	 *
	 * @returns The import specifier, or `undefined` for unsupported dialects.
	 */
	private getDialectModulePath(): string | undefined {
		switch (this.dialect) {
			case "PostgreSQL":
				return "drizzle-orm/pg-core";
			case "MySQL":
				return "drizzle-orm/mysql-core";
			case "SQLite":
				return "drizzle-orm/sqlite-core";
			default:
				return undefined;
		}
	}
}
