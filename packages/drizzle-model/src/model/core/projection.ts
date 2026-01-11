type AnyObj = Record<string, any>;

type ProjectionResult = {
  selectMap?: AnyObj;
};

function isDrizzleColumn(value: any): boolean {
  return !!value && typeof value === "object" && typeof value.getSQL === "function";
}

function getTableColumnsMap(table: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const [key, value] of Object.entries(table)) {
    if (isDrizzleColumn(value)) out[key] = value;
  }
  return out;
}

export function buildSelectProjection(table: AnyObj, select?: AnyObj, exclude?: AnyObj): ProjectionResult {
  const all = getTableColumnsMap(table);

  if (select && typeof select === "object") {
    const picked: AnyObj = {};
    for (const [key, value] of Object.entries(select)) {
      if (value === true && key in all) {
        picked[key] = all[key];
      }
    }

    // If nothing was picked, fall back to selecting all columns.
    if (Object.keys(picked).length) return { selectMap: picked };
    return { selectMap: all };
  }

  if (exclude && typeof exclude === "object") {
    const omitted: AnyObj = { ...all };
    for (const [key, value] of Object.entries(exclude)) {
      if (value === true) delete omitted[key];
    }

    // If everything was excluded (edge case), fall back to selecting all columns.
    if (Object.keys(omitted).length) return { selectMap: omitted };
    return { selectMap: all };
  }

  return { selectMap: all };
}
