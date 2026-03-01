import { and, eq } from "drizzle-orm";
import type { DialectHelper } from "../dialect.ts";
import { ProjectionBuilder } from "./projection.ts";
import { WhereCompiler } from "./where.ts";

/** Generic record type used throughout the join executor. */
type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Join node — describes one relation join in the tree
// ---------------------------------------------------------------------------

/**
 * A single node in the join tree.
 *
 * Each node represents one relation that will be LEFT-JOINed into the
 * base query. Nodes form a tree rooted at the base table, where child
 * nodes correspond to nested relations (e.g. `with: { posts: { comments: true } }`).
 */
export interface JoinNode {
	/** Unique alias key used for the select map namespace. */
	aliasKey: string;
	/** Child nodes for nested relations. */
	children: JoinNode[];
	/** The relation key on the parent table. */
	key: string;
	/** Parent node, or `undefined` for root-level relations. */
	parent?: JoinNode;
	/** The full dot-separated path from root (e.g. `["posts", "comments"]`). */
	path: string[];
	/** The primary key field name on the target table. */
	pkField: string;
	/** Whether this is a `"one"` or `"many"` relation. */
	relationType: "one" | "many";
	/** Source columns participating in the join condition. */
	sourceColumns: unknown[];
	/** The Drizzle source table reference. */
	sourceTable: AnyRecord;
	/** Name of the source (parent) table. */
	sourceTableName: string;
	/** The aliased Drizzle target table used in the join. */
	targetAliasTable: AnyRecord;
	/** Target columns participating in the join condition. */
	targetColumns: unknown[];
	/** The original (non-aliased) Drizzle target table. */
	targetTable: AnyRecord;
	/** Name of the target (child) table. */
	targetTableName: string;
	/** Optional compiled WHERE filter for this relation (added to JOIN ON). */
	whereFilter?: unknown;
}

// ---------------------------------------------------------------------------
// Configuration for the executor
// ---------------------------------------------------------------------------

/** Input configuration for {@link JoinExecutor.execute}. */
export interface JoinExecutorConfig {
	/** The Drizzle table object for the base table. */
	baseTable: AnyRecord;
	/** The name of the base table being queried. */
	baseTableName: string;
	/** The Drizzle database instance. */
	db: unknown;
	/** SQL SELECT blacklist for base table columns. */
	exclude?: AnyRecord;
	/** When `true`, only the first result is returned. */
	limitOne?: boolean;
	/** The relations metadata map from Drizzle. */
	relations: Record<string, AnyRecord>;
	/** The full schema map (`{ tableName: drizzleTable }`). */
	schema: Record<string, AnyRecord>;
	/** SQL SELECT whitelist for base table columns. */
	select?: AnyRecord;
	/** An optional compiled SQL where clause. */
	whereSql?: unknown;
	/** The user-supplied `.with()` value describing which relations to load. */
	withValue: AnyRecord;
}

// ---------------------------------------------------------------------------
// JoinExecutor
// ---------------------------------------------------------------------------

/**
 * Executes queries that load related entities via LEFT JOINs.
 *
 * Builds a join tree from the `.with()` descriptor, constructs a single
 * multi-join query, and then groups the flat rows back into a nested
 * object structure matching the requested relations.
 *
 * Usage:
 * ```ts
 * const executor = new JoinExecutor(dialectHelper);
 * const result = await executor.execute(config);
 * ```
 */
export class JoinExecutor {
	private readonly dialect: DialectHelper;
	private readonly projection: ProjectionBuilder;
	private readonly whereCompiler: WhereCompiler;

	constructor(dialect: DialectHelper) {
		this.dialect = dialect;
		this.projection = new ProjectionBuilder();
		this.whereCompiler = new WhereCompiler();
	}

	/**
	 * Executes a query with LEFT JOINs for the requested relations,
	 * then groups the flat result into a nested object tree.
	 *
	 * @param config - The full join execution configuration.
	 * @returns A single object (when `limitOne`) or an array of grouped results.
	 */
	async execute(config: JoinExecutorConfig): Promise<unknown> {
		const root = await this.buildJoinTree(config);
		const flatNodes = this.flattenNodes(root);

		const rows = await this.executeQuery(config, root, flatNodes);
		const grouped = this.groupRows(rows, root, flatNodes);

		return config.limitOne ? grouped[0] : grouped;
	}

	// ---------------------------------------------------------------------------
	// Tree construction
	// ---------------------------------------------------------------------------

	/**
	 * Builds the full join tree from the `.with()` descriptor.
	 *
	 * The root node represents the base table. Each key in the `withValue`
	 * map becomes a child node, potentially with nested children.
	 */
	private async buildJoinTree(config: JoinExecutorConfig): Promise<JoinNode> {
		const usedAliasKeys = new Set<string>();
		usedAliasKeys.add(`table:${config.baseTableName}`);

		const root: JoinNode = {
			path: [],
			key: "$root",
			relationType: "one",
			sourceTableName: config.baseTableName,
			targetTableName: config.baseTableName,
			sourceTable: config.baseTable,
			targetTable: config.baseTable,
			targetAliasTable: config.baseTable,
			aliasKey: "$base",
			sourceColumns: [],
			targetColumns: [],
			pkField: this.getPrimaryKeyField(config.baseTable),
			children: [],
		};

		for (const [key, value] of Object.entries(config.withValue)) {
			if (value !== true && (typeof value !== "object" || value == null)) {
				continue;
			}

			const child = await this.buildNode(
				config,
				usedAliasKeys,
				undefined,
				config.baseTableName,
				config.baseTable,
				key,
				value,
				[]
			);
			root.children.push(child);
		}

		return root;
	}

	/**
	 * Recursively builds a single join node and its children.
	 *
	 * Resolves relation metadata, determines whether aliasing is needed,
	 * and descends into nested sub-relations.
	 */
	private async buildNode(
		config: JoinExecutorConfig,
		usedAliasKeys: Set<string>,
		parent: JoinNode | undefined,
		currentTableName: string,
		currentTable: AnyRecord,
		key: string,
		value: unknown,
		path: string[]
	): Promise<JoinNode> {
		const { whereValue, nestedWith } =
			this.extractRelationDescriptor(value);

		const relMeta = this.getRelationMeta(
			config.relations,
			currentTableName,
			key
		);
		const targetTableName: string = relMeta.targetTableName as string;
		const targetTable: AnyRecord =
			config.schema[targetTableName] ?? ({} as AnyRecord);

		const aliasKey = this.resolveUniqueAlias(usedAliasKeys, [...path, key]);

		const needsAlias =
			targetTableName === currentTableName ||
			usedAliasKeys.has(`table:${targetTableName}`);
		usedAliasKeys.add(`table:${targetTableName}`);

		const targetAliasTable = needsAlias
			? await this.dialect.createTableAlias(targetTable, aliasKey)
			: targetTable;

		const whereFilter = whereValue
			? this.whereCompiler.compile(
					targetAliasTable as AnyRecord,
					whereValue
			  )
			: undefined;

		const node: JoinNode = {
			path: [...path, key],
			key,
			relationType: relMeta.relationType as "one" | "many",
			sourceTableName: currentTableName,
			targetTableName,
			sourceTable: currentTable,
			targetTable,
			targetAliasTable,
			aliasKey,
			sourceColumns: (relMeta.sourceColumns ?? []) as unknown[],
			targetColumns: (relMeta.targetColumns ?? []) as unknown[],
			pkField: this.getPrimaryKeyField(targetAliasTable),
			parent,
			children: [],
			whereFilter,
		};

		if (nestedWith && typeof nestedWith === "object") {
			for (const [childKey, childVal] of Object.entries(
				nestedWith as AnyRecord
			)) {
				if (
					childVal !== true &&
					(typeof childVal !== "object" || childVal == null)
				) {
					continue;
				}

				const child = await this.buildNode(
					config,
					usedAliasKeys,
					node,
					targetTableName,
					targetAliasTable,
					childKey,
					childVal,
					[...path, key]
				);
				node.children.push(child);
			}
		}

		return node;
	}

	// ---------------------------------------------------------------------------
	// Query execution
	// ---------------------------------------------------------------------------

	/**
	 * Builds and executes the multi-join SELECT query.
	 *
	 * Constructs a select map namespaced by alias key (base + each join),
	 * applies LEFT JOINs in preorder, and optionally limits to one row.
	 */
	private async executeQuery(
		config: JoinExecutorConfig,
		root: JoinNode,
		nodes: JoinNode[]
	): Promise<AnyRecord[]> {
		const baseColumns = this.projection.build(
			root.targetAliasTable,
			config.select,
			config.exclude
		).selectMap;

		const selectMap: AnyRecord = {
			base: baseColumns,
		};

		for (const node of nodes) {
			selectMap[node.aliasKey] = this.projection.extractColumns(
				node.targetAliasTable
			);
		}

		const db = config.db as AnyRecord;
		let query = (db.select as (map: AnyRecord) => AnyRecord)(selectMap);
		query = (query as AnyRecord & { from: (t: AnyRecord) => AnyRecord }).from(
			config.baseTable
		);

		if (config.whereSql) {
			query = (query as AnyRecord & { where: (w: unknown) => AnyRecord }).where(
				config.whereSql
			);
		}

		for (const node of nodes) {
			const onCondition = this.buildJoinOn(node);
			query = (
				query as AnyRecord & {
					leftJoin: (t: AnyRecord, on: unknown) => AnyRecord;
				}
			).leftJoin(node.targetAliasTable, onCondition);
		}

		if (config.limitOne) {
			query = (query as AnyRecord & { limit: (n: number) => AnyRecord }).limit(
				1
			);
		}

		return (await (query as unknown as PromiseLike<
			AnyRecord[]
		>)) as AnyRecord[];
	}

	// ---------------------------------------------------------------------------
	// Result grouping
	// ---------------------------------------------------------------------------

	/**
	 * Groups flat joined rows back into a nested object structure.
	 *
	 * Uses the base table's primary key to deduplicate base rows, then
	 * attaches relation data to the correct parent in the tree.
	 */
	private groupRows(
		rows: AnyRecord[],
		root: JoinNode,
		nodes: JoinNode[]
	): AnyRecord[] {
		const basePk = root.pkField;
		const baseMap = new Map<unknown, AnyRecord>();
		const manyIndexByPath = new Map<string, Map<unknown, AnyRecord>>();

		for (const row of rows) {
			const baseRow = (row as AnyRecord).base as AnyRecord;
			const baseId = baseRow[basePk];
			if (baseId === undefined) {
				continue;
			}

			const baseObj = this.getOrCreateBase(baseMap, baseId, baseRow);

			for (const node of nodes) {
				const data = (row as AnyRecord)[node.aliasKey] as
					| AnyRecord
					| null
					| undefined;
				const relPath = node.path.join(".");
				const parentObj = this.resolveParentObject(
					node,
					baseObj,
					manyIndexByPath
				);

				if (this.isAllNull(data)) {
					this.ensureContainer(parentObj, node);
					continue;
				}

				const pk = (data as AnyRecord)[node.pkField];

				if (node.relationType === "one") {
					parentObj[node.key] = { ...(data as AnyRecord) };
				} else {
					this.ensureManyArray(parentObj, node.key);
					const indexMap = this.getOrCreateIndexMap(manyIndexByPath, relPath);

					if (!indexMap.has(pk)) {
						const obj = { ...(data as AnyRecord) };
						indexMap.set(pk, obj);
						(parentObj[node.key] as unknown[]).push(obj);
					}
				}
			}
		}

		return Array.from(baseMap.values());
	}

	// ---------------------------------------------------------------------------
	// Helpers: join conditions
	// ---------------------------------------------------------------------------

	/**
	 * Builds the ON clause for a single join node.
	 *
	 * Maps source columns to their corresponding aliased target columns
	 * and produces an equality (or multi-equality with AND) condition.
	 */
	private buildJoinOn(node: JoinNode): unknown {
		const parts = (node.sourceColumns as unknown[]).map((src, i) => {
			const tgt = (node.targetColumns as unknown[])[i];
			const tgtKey = Object.entries(node.targetTable).find(
				([, v]) => v === tgt
			)?.[0];
			const tgtCol = tgtKey
				? (node.targetAliasTable as AnyRecord)[tgtKey]
				: tgt;
			return eq(tgtCol as never, src as never);
		});

		if (node.whereFilter) {
			parts.push(node.whereFilter as never);
		}

		return parts.length === 1 ? parts[0] : and(...parts);
	}

	// ---------------------------------------------------------------------------
	// Helpers: tree traversal & aliasing
	// ---------------------------------------------------------------------------

	/**
	 * Flattens the join tree into a preorder list (excluding the root).
	 *
	 * The order matches the LEFT JOIN application order in the query.
	 */
	private flattenNodes(root: JoinNode): JoinNode[] {
		const nodes: JoinNode[] = [];

		const walk = (node: JoinNode): void => {
			for (const child of node.children) {
				nodes.push(child);
				walk(child);
			}
		};
		walk(root);

		return nodes;
	}

	/**
	 * Generates a unique alias key for a join node, avoiding collisions
	 * with previously used keys.
	 */
	private resolveUniqueAlias(usedKeys: Set<string>, path: string[]): string {
		const base = path.join("__");
		let alias = base;
		let counter = 1;

		while (usedKeys.has(alias)) {
			alias = `${base}_${counter++}`;
		}

		usedKeys.add(alias);
		return alias;
	}

	/**
	 * Retrieves the relation metadata for a given table and relation key.
	 *
	 * @throws {Error} When the relation is not found in the schema metadata.
	 */
	private getRelationMeta(
		relations: Record<string, AnyRecord>,
		tableName: string,
		key: string
	): AnyRecord {
		const tableRelations = relations[tableName] as AnyRecord | undefined;
		const relationsMap = tableRelations?.relations as AnyRecord | undefined;
		const relMeta = relationsMap?.[key] as AnyRecord | undefined;

		if (!relMeta) {
			throw new Error(`Unknown relation '${key}' on table '${tableName}'.`);
		}

		return relMeta;
	}

	// ---------------------------------------------------------------------------
	// Helpers: primary key detection
	// ---------------------------------------------------------------------------

	/**
	 * Detects the primary key field name of a Drizzle table.
	 *
	 * Tries (in order):
	 * 1. A column with `primary === true`.
	 * 2. A column with `config.primaryKey === true`.
	 * 3. A field named `"id"`.
	 * 4. The first Drizzle column found.
	 */
	private getPrimaryKeyField(table: AnyRecord): string {
		for (const [key, value] of Object.entries(table)) {
			if (!this.isDrizzleColumn(value)) {
				continue;
			}
			const col = value as AnyRecord;
			if (col.primary === true) {
				return key;
			}
			if ((col.config as AnyRecord | undefined)?.primaryKey === true) {
				return key;
			}
		}

		if ("id" in table) {
			return "id";
		}

		return (
			Object.keys(table).find((k) => this.isDrizzleColumn(table[k])) ?? "id"
		);
	}

	/** Checks whether a value is a Drizzle column reference. */
	private isDrizzleColumn(value: unknown): boolean {
		return (
			!!value &&
			typeof value === "object" &&
			typeof (value as AnyRecord).getSQL === "function"
		);
	}

	/**
	 * Extracts relation where clause and nested relations from a `.with()` value.
	 *
	 * Handles three cases:
	 * - `true` → no filter, no nested relations.
	 * - A ModelRuntime (has `$model === "model"`) → extract `$where`, no nested.
	 * - A model descriptor (`__modelRelation: true`) → extract `whereValue` and `with`.
	 * - A plain object → treat as nested relation map.
	 */
	private extractRelationDescriptor(value: unknown): {
		whereValue: unknown;
		nestedWith: unknown;
	} {
		if (value === true || value == null) {
			return { whereValue: undefined, nestedWith: undefined };
		}

		if (typeof value !== "object") {
			return { whereValue: undefined, nestedWith: undefined };
		}

		const rec = value as AnyRecord;

		if (rec.$model === "model") {
			return { whereValue: rec.$where, nestedWith: undefined };
		}

		if (rec.__modelRelation === true) {
			return { whereValue: rec.whereValue, nestedWith: rec.with };
		}

		return { whereValue: undefined, nestedWith: value };
	}

	// ---------------------------------------------------------------------------
	// Helpers: result grouping internals
	// ---------------------------------------------------------------------------

	/**
	 * Gets or creates the base-row object for a given primary key.
	 */
	private getOrCreateBase(
		baseMap: Map<unknown, AnyRecord>,
		baseId: unknown,
		baseRow: AnyRecord
	): AnyRecord {
		const existing = baseMap.get(baseId);
		if (existing) {
			return existing;
		}
		const created = { ...baseRow };
		baseMap.set(baseId, created);
		return created;
	}

	/**
	 * Resolves the parent object that a join node's data should attach to.
	 *
	 * For root-level relations, the parent is the base row. For nested
	 * relations, it is the last inserted instance of the parent node.
	 */
	private resolveParentObject(
		node: JoinNode,
		baseObj: AnyRecord,
		manyIndexByPath: Map<string, Map<unknown, AnyRecord>>
	): AnyRecord {
		if (!node.parent) {
			return baseObj;
		}

		const parentPath = node.parent.path.join(".");
		if (!parentPath) {
			return baseObj;
		}

		const parentIndex = manyIndexByPath.get(parentPath);
		if (parentIndex && parentIndex.size > 0) {
			return Array.from(parentIndex.values()).at(-1) as AnyRecord;
		}

		const parentKey = node.parent.key;
		return (baseObj[parentKey] as AnyRecord | undefined) ?? baseObj;
	}

	/** Checks whether all values in a row are `null` or `undefined`. */
	private isAllNull(obj: AnyRecord | null | undefined): boolean {
		if (!obj || typeof obj !== "object") {
			return true;
		}
		for (const value of Object.values(obj)) {
			if (value !== null && value !== undefined) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Ensures the correct empty container exists on the parent for a node.
	 *
	 * Creates `[]` for many-relations and `null` for one-relations.
	 */
	private ensureContainer(parentObj: AnyRecord, node: JoinNode): void {
		if (node.relationType === "one") {
			if (!(node.key in parentObj)) {
				parentObj[node.key] = null;
			}
		} else {
			this.ensureManyArray(parentObj, node.key);
		}
	}

	/** Ensures `parentObj[key]` is an array. */
	private ensureManyArray(parentObj: AnyRecord, key: string): void {
		if (!Array.isArray(parentObj[key])) {
			parentObj[key] = [];
		}
	}

	/** Gets or creates a deduplication index map for a many-relation path. */
	private getOrCreateIndexMap(
		manyIndexByPath: Map<string, Map<unknown, AnyRecord>>,
		relPath: string
	): Map<unknown, AnyRecord> {
		let indexMap = manyIndexByPath.get(relPath);
		if (!indexMap) {
			indexMap = new Map();
			manyIndexByPath.set(relPath, indexMap);
		}
		return indexMap;
	}
}
