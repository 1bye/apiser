import { type Table as DrizzleTable } from "drizzle-orm";

export type DrizzleColumns<Table extends DrizzleTable> = Table["_"]["columns"];
export type DrizzleColumn<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
> = Columns[keyof Columns];

export type DrizzleDataKind =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "json"
  | "date"
  | "bigint"
  | "custom"
  | "buffer"
  | "dateDuration"
  | "duration"
  | "relDuration"
  | "localTime"
  | "localDate"
  | "localDateTime";

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

export type { DrizzleTable };
