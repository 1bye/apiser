import { and, eq } from "drizzle-orm";

type AnyObj = Record<string, any>;

type JoinNode = {
  path: string[];
  key: string;
  relationType: "one" | "many";
  sourceTableName: string;
  targetTableName: string;
  sourceTable: AnyObj;
  targetTable: AnyObj;
  targetAliasTable: AnyObj;
  aliasKey: string;
  sourceColumns: any[];
  targetColumns: any[];
  pkField: string;
  parent?: JoinNode;
  children: JoinNode[];
};

function isDrizzleColumn(value: any): boolean {
  return !!value && typeof value === "object" && typeof value.getSQL === "function";
}

function getPrimaryKeyField(table: AnyObj): string {
  for (const [k, v] of Object.entries(table)) {
    if (!isDrizzleColumn(v)) continue;
    if ((v as any).primary === true) return k;
    if ((v as any).config?.primaryKey === true) return k;
  }
  if ("id" in table) return "id";
  return Object.keys(table).find((k) => isDrizzleColumn((table as any)[k])) ?? "id";
}

function isAllNullRow(obj: AnyObj | null | undefined): boolean {
  if (!obj || typeof obj !== "object") return true;
  for (const v of Object.values(obj)) {
    if (v !== null && v !== undefined) return false;
  }
  return true;
}

async function aliasTable(table: AnyObj, aliasName: string, dialect: string): Promise<AnyObj> {
  // Drizzle exports `alias()` from dialect-specific core modules.
  // We keep this dynamic to avoid hard dependency on a single dialect.
  if (dialect === "PostgreSQL") {
    const mod: any = await import("drizzle-orm/pg-core");
    if (typeof mod.alias === "function") return mod.alias(table, aliasName);
  }
  if (dialect === "MySQL") {
    const mod: any = await import("drizzle-orm/mysql-core");
    if (typeof mod.alias === "function") return mod.alias(table, aliasName);
  }
  if (dialect === "SQLite") {
    const mod: any = await import("drizzle-orm/sqlite-core");
    if (typeof mod.alias === "function") return mod.alias(table, aliasName);
  }

  return table;
}

function buildJoinOn(node: JoinNode): any {
  const parts = node.sourceColumns.map((src, i) => {
    const tgt = node.targetColumns[i];
    // tgt is a column bound to the *original* target table; we need the one from alias table.
    const tgtKey = Object.entries(node.targetTable).find(([, v]) => v === tgt)?.[0];
    const tgtCol = tgtKey ? (node.targetAliasTable as any)[tgtKey] : tgt;
    return eq(tgtCol, src);
  });
  return parts.length === 1 ? parts[0] : and(...parts);
}

function buildSelectMapForTable(table: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(table)) {
    if (isDrizzleColumn(v)) out[k] = v;
  }
  return out;
}

export async function executeWithJoins(args: {
  db: any;
  schema: Record<string, any>;
  relations: Record<string, any>;
  baseTableName: string;
  baseTable: AnyObj;
  dialect: string;
  whereSql?: any;
  withValue: AnyObj;
  limitOne?: boolean;
}): Promise<any> {
  const { db, schema, relations, baseTableName, baseTable, dialect, whereSql, withValue, limitOne } = args;

  const usedAliasKeys = new Set<string>();

  const buildNode = async (
    parent: JoinNode | undefined,
    currentTableName: string,
    currentTable: AnyObj,
    key: string,
    value: any,
    path: string[],
  ): Promise<JoinNode> => {
    const relMeta = (relations as any)[currentTableName]?.relations?.[key];
    if (!relMeta) throw new Error(`Unknown relation '${key}' on table '${currentTableName}'.`);

    const targetTableName: string = relMeta.targetTableName;
    const targetTable: AnyObj = (schema as any)[targetTableName];
    const aliasKeyBase = [...path, key].join("__");
    let aliasKey = aliasKeyBase;
    let idx = 1;
    while (usedAliasKeys.has(aliasKey)) {
      aliasKey = `${aliasKeyBase}_${idx++}`;
    }
    usedAliasKeys.add(aliasKey);

    const needsAlias = targetTableName === currentTableName || usedAliasKeys.has(`table:${targetTableName}`);
    usedAliasKeys.add(`table:${targetTableName}`);

    const targetAliasTable = needsAlias ? await aliasTable(targetTable, aliasKey, dialect) : targetTable;

    const node: JoinNode = {
      path: [...path, key],
      key,
      relationType: relMeta.relationType,
      sourceTableName: currentTableName,
      targetTableName,
      sourceTable: currentTable,
      targetTable,
      targetAliasTable,
      aliasKey,
      sourceColumns: relMeta.sourceColumns ?? [],
      targetColumns: relMeta.targetColumns ?? [],
      pkField: getPrimaryKeyField(targetAliasTable),
      parent,
      children: [],
    };

    if (value && typeof value === "object" && value !== true) {
      for (const [childKey, childVal] of Object.entries(value)) {
        if (childVal !== true && (typeof childVal !== "object" || childVal == null)) continue;
        const child = await buildNode(node, targetTableName, targetAliasTable, childKey, childVal, [...path, key]);
        node.children.push(child);
      }
    }

    return node;
  };

  const root: JoinNode = {
    path: [],
    key: "$root",
    relationType: "one",
    sourceTableName: baseTableName,
    targetTableName: baseTableName,
    sourceTable: baseTable,
    targetTable: baseTable,
    targetAliasTable: baseTable,
    aliasKey: "$base",
    sourceColumns: [],
    targetColumns: [],
    pkField: getPrimaryKeyField(baseTable),
    children: [],
  };

  for (const [key, value] of Object.entries(withValue)) {
    if (value !== true && (typeof value !== "object" || value == null)) continue;
    const child = await buildNode(undefined, baseTableName, baseTable, key, value, []);
    root.children.push(child);
  }

  // Flatten nodes in join order (preorder)
  const nodes: JoinNode[] = [];
  const walk = (n: JoinNode) => {
    for (const c of n.children) {
      nodes.push(c);
      walk(c);
    }
  };
  walk(root);

  // Build select map: base + each joined alias
  const selectMap: AnyObj = {
    base: buildSelectMapForTable(baseTable),
  };
  for (const n of nodes) {
    selectMap[n.aliasKey] = buildSelectMapForTable(n.targetAliasTable);
  }

  let q = db.select(selectMap).from(baseTable);
  if (whereSql) q = q.where(whereSql);

  // Apply joins
  for (const n of nodes) {
    const on = buildJoinOn(n);
    q = q.leftJoin(n.targetAliasTable, on);
  }

  if (limitOne) q = q.limit(1);

  const rows = await q;

  // Group rows into nested objects.
  const basePk = root.pkField;
  const baseMap = new Map<any, AnyObj>();

  const ensureManyContainer = (obj: AnyObj, key: string) => {
    if (!Array.isArray(obj[key])) obj[key] = [];
  };

  const ensureOneContainer = (obj: AnyObj, key: string) => {
    if (!(key in obj)) obj[key] = null;
  };

  const manyIndexByPath = new Map<string, Map<any, AnyObj>>();

  for (const row of rows) {
    const baseRow = (row as any).base;
    const baseId = (baseRow as any)[basePk];
    if (baseId === undefined) continue;

    const baseObj = (() => {
      const existing = baseMap.get(baseId);
      if (existing) return existing;
      const created = { ...baseRow };
      baseMap.set(baseId, created);
      return created;
    })();

    // Walk nodes, attach to parent objects.
    for (const n of nodes) {
      const data = (row as any)[n.aliasKey];
      const relPath = n.path.join(".");

      // Resolve parent container
      const parentPath = n.parent ? n.parent.path.join(".") : "";
      let parentObj: AnyObj = baseObj;
      if (parentPath) {
        // parent might be many; we attach to the last inserted parent instance.
        const parentIndex = manyIndexByPath.get(parentPath);
        if (parentIndex && parentIndex.size) {
          // pick last inserted (Map preserves insertion order)
          parentObj = Array.from(parentIndex.values()).at(-1) as AnyObj;
        } else {
          const parentKey = n.parent?.key;
          parentObj = parentKey ? ((baseObj as any)[parentKey] ?? baseObj) : baseObj;
        }
      }

      if (isAllNullRow(data)) {
        if (n.relationType === "one") {
          ensureOneContainer(parentObj, n.key);
        } else {
          ensureManyContainer(parentObj, n.key);
        }
        continue;
      }

      const pk = (data as any)[n.pkField];
      if (n.relationType === "one") {
        parentObj[n.key] = { ...(data as any) };
      } else {
        ensureManyContainer(parentObj, n.key);
        const indexKey = relPath;
        if (!manyIndexByPath.has(indexKey)) manyIndexByPath.set(indexKey, new Map());
        const idxMap = manyIndexByPath.get(indexKey)!;
        if (!idxMap.has(pk)) {
          const obj = { ...(data as any) };
          idxMap.set(pk, obj);
          (parentObj[n.key] as any[]).push(obj);
        }
      }
    }
  }

  const out = Array.from(baseMap.values());
  return limitOne ? out[0] : out;
}
