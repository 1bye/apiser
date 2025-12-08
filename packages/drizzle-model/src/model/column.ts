import type { Column } from "drizzle-orm";
import type {
  DrizzleRawOutput,
  DrizzleColumns,
  DrizzleDataType,
  DrizzleTable,
  DrizzleInsertModel,
  DrizzleInsertValues,
} from "./types";
import type { ModelFunctionResult } from "./promise";

export type FindOneOptions = Omit<FindOptions, "overrideLimit">;
export type FindOptions = {} & BaseColumnFunctionOptions;
export type InsertOptions = {} & BaseColumnFunctionOptions;

export type BaseColumnFunctionOptions = {
  overrideLimit?: number;
};

export type BaseColumnFunctions<Table extends DrizzleTable> = {
  find: (options?: FindOptions) => Promise<DrizzleRawOutput<Table>[]>;
  findOne: (
    options?: FindOneOptions,
  ) => Promise<DrizzleRawOutput<Table> | null>;
  insert: <
    Values extends DrizzleInsertValues<Table> = DrizzleInsertValues<Table>,
    Output extends DrizzleRawOutput<Table> = DrizzleRawOutput<Table>,
  >(
    values: Values,
    options?: InsertOptions,
  ) => ModelFunctionResult<Values extends any[] ? Output[] : Output, void>;
};

export type ColumnFunctions<
  Table extends DrizzleTable,
  TableColumn extends Column,
> = {
  limit: (value: number) => ColumnFunctions<Table, TableColumn>;
  offset: (value: number) => ColumnFunctions<Table, TableColumn>;
  // delete: () => void;
} & BaseColumnFunctions<Table>;

type ColumnOpsBase<T> = {
  equal?: T;
  not?: T;
  in?: T[];
  nin?: T[];
  isNull?: boolean;
};

type NumberOps = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  between?: [number, number];
  notBetween?: [number, number];
};

type StringOps = {
  like?: string;
  ilike?: string;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  regex?: string;
  notRegex?: string;
  length?: NumberOps;
};

type BoolOps = {
  isTrue?: boolean;
  isFalse?: boolean;
};

type DateOps = {
  before?: Date | string;
  after?: Date | string;
  on?: Date | string;
  notOn?: Date | string;
  between?: [Date | string, Date | string];
};

type JsonOps<T> = {
  has?: T;
  hasAny?: T[];
  hasAll?: T[];
  len?: NumberOps;
};

type LogicalOps<TableColumn extends Column> = {
  or?: ColumnOption<TableColumn>[];
  and?: ColumnOption<TableColumn>[];
};

type SpecificOps<T> = T extends number
  ? NumberOps
  : T extends string
    ? StringOps
    : T extends boolean
      ? BoolOps
      : T extends Date
        ? DateOps
        : T extends any[]
          ? JsonOps<T[number]>
          : {};

export type ColumnDType<TableColumn extends Column> = DrizzleDataType<
  TableColumn["dataType"]
>;

export type ColumnOption<
  TableColumn extends Column,
  DataType extends ColumnDType<TableColumn> = ColumnDType<TableColumn>,
> =
  | DataType
  | (ColumnOpsBase<DataType> & SpecificOps<DataType> & LogicalOps<TableColumn>);

export type ColumnOptionFn<TableColumn extends Column, T> = (
  option: ColumnOption<TableColumn>,
) => T;

export type ModelColumnFunctions<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
  ColumnKeys extends keyof Columns & string = keyof Columns & string,
> = {
  [ColumnKey in ColumnKeys]: ColumnOptionFn<
    Columns[ColumnKey],
    ColumnFunctions<Table, Columns[ColumnKey]> &
      ModelColumnFunctions<Table, Columns, Exclude<ColumnKeys, ColumnKey>>
  >;
};
