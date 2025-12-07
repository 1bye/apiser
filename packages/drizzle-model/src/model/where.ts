import type { Column } from "drizzle-orm";
import {
  and,
  between,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  like,
  lt,
  lte,
  ne,
  notBetween,
  notInArray,
  or,
} from "drizzle-orm";
import type { ColumnOption } from "./column";

export function buildColumnCondition<TableColumn extends Column>(
  column: TableColumn,
  option: ColumnOption<TableColumn>,
) {
  if (option === null || option === undefined) return undefined;

  if (typeof option !== "object" || Array.isArray(option)) {
    return eq(column as any, option as any);
  }

  const opt = option as any;
  const parts: any[] = [];

  if (Object.prototype.hasOwnProperty.call(opt, "equal")) {
    parts.push(eq(column as any, opt.equal));
  }

  if (Object.prototype.hasOwnProperty.call(opt, "not")) {
    parts.push(ne(column as any, opt.not));
  }

  if (opt.in && opt.in.length) {
    parts.push(inArray(column as any, opt.in as any[]));
  }

  if (opt.nin && opt.nin.length) {
    parts.push(notInArray(column as any, opt.nin as any[]));
  }

  if (opt.isNull === true) {
    parts.push(isNull(column as any));
  }

  if (typeof opt.gt !== "undefined") {
    parts.push(gt(column as any, opt.gt));
  }

  if (typeof opt.gte !== "undefined") {
    parts.push(gte(column as any, opt.gte));
  }

  if (typeof opt.lt !== "undefined") {
    parts.push(lt(column as any, opt.lt));
  }

  if (typeof opt.lte !== "undefined") {
    parts.push(lte(column as any, opt.lte));
  }

  if (opt.between) {
    const [from, to] = opt.between;
    parts.push(between(column as any, from, to));
  }

  if (opt.notBetween) {
    const [from, to] = opt.notBetween;
    parts.push(notBetween(column as any, from, to));
  }

  if (opt.like) {
    parts.push(like(column as any, opt.like));
  }

  if (opt.ilike) {
    parts.push(ilike(column as any, opt.ilike));
  }

  if (opt.or && opt.or.length) {
    const orParts = opt.or
      .map((nested: ColumnOption<TableColumn>) =>
        buildColumnCondition(column, nested),
      )
      .filter(Boolean) as any[];

    if (orParts.length) {
      parts.push(or(...orParts));
    }
  }

  if (opt.and && opt.and.length) {
    const andParts = opt.and
      .map((nested: ColumnOption<TableColumn>) =>
        buildColumnCondition(column, nested),
      )
      .filter(Boolean) as any[];

    if (andParts.length) {
      parts.push(and(...andParts));
    }
  }

  if (!parts.length) return undefined;

  if (parts.length === 1) return parts[0];

  return and(...parts);
}
