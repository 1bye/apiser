import {
  type AnyRelation,
  type ColumnDataConstraint,
  type ColumnDataType,
  type ColumnType,
  type ColumnTypeData,
  type Table as DrizzleTable,
  type InferInsertModel,
  type InferSelectModel,
  type RelationsBuilderConfigValue,
  type RelationsRecord,
  type Schema,
} from "drizzle-orm";

export type DrizzleColumns<Table extends DrizzleTable> = Table["_"]["columns"];
export type DrizzleColumn<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
> = Columns[keyof Columns];

export type DrizzleRawOutput<Table extends DrizzleTable> =
  InferSelectModel<Table>;

export type DrizzleInsertModel<Table extends DrizzleTable> =
  InferInsertModel<Table>;

export type DrizzleInsertValues<Table extends DrizzleTable> =
  | DrizzleInsertModel<Table>
  | DrizzleInsertModel<Table>[];

export type ParseColumnType<T extends ColumnType> =
  // Case 1: "number int32" (type + constraint)
  T extends `${infer TType extends ColumnDataType} ${infer TConstraint extends ColumnDataConstraint}`
    ? ColumnTypeData<TType, TConstraint>
    : // Case 2: "string" | "number" | "array" | ...
      T extends `${infer TType extends ColumnDataType}`
      ? ColumnTypeData<TType, undefined>
      : // Should never happen, but keeps TS satisfied
        never;

export type ColumnTypeToDrizzleKind<T extends ColumnTypeData> =
  T["type"] extends "string"
    ? "string"
    : T["type"] extends "number"
      ? "number"
      : T["type"] extends "boolean"
        ? "boolean"
        : T["type"] extends "array"
          ? "array"
          : T["type"] extends "object"
            ? "json"
            : T["type"] extends "bigint"
              ? "bigint"
              : T["type"] extends "custom"
                ? "custom"
                : never;

export type DrizzleColumnTypeToType<T extends ColumnType> = DrizzleDataType<
  ColumnTypeToDrizzleKind<ParseColumnType<T>>
>;

export type DrizzleDataKindMap = {
  string: string;
  number: number;
  boolean: boolean;
  array: unknown[];
  json: Record<string, unknown>;
  date: Date;
  bigint: bigint;
  custom: unknown;
  buffer: ArrayBuffer;

  // the following could be real domain types, but default to string/date
  dateDuration: string;
  duration: string;
  relDuration: string;
  localTime: string;
  localDate: string;
  localDateTime: string;
};

export type DrizzleDataType<K extends keyof DrizzleDataKindMap> =
  DrizzleDataKindMap[K];

export type NonUndefined<T> = T extends undefined ? never : T;

// export type DrizzleRelations = NonUndefined<RelationsBuilderConfigValue>;
export type DrizzleRelations = RelationsRecord;

export type IsDrizzleTable<T> = T extends DrizzleTable ? T : never;

export type DrizzleSchema = Schema;
export type DrizzleAnyRelation = AnyRelation;

export type { DrizzleTable };
