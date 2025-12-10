import type { Column, RelationsBuilderConfigValue, Schema } from "drizzle-orm";
import type {
  DrizzleRawOutput,
  DrizzleColumns,
  DrizzleColumnTypeToType,
  DrizzleTable,
  DrizzleInsertModel,
  DrizzleInsertValues,
  DrizzleRelations,
} from "./types";
import type { IFindResult, ModelFunctionResult } from "./promise";

export type FindOneOptions = Omit<FindOptions, "overrideLimit">;
export type FindOptions = {} & BaseColumnFunctionOptions;
export type InsertOptions = {} & BaseColumnFunctionOptions;

export type BaseColumnFunctionOptions = {
  overrideLimit?: number;
};

export type WithValue<Relation extends DrizzleRelations = DrizzleRelations> = {
  [Key in keyof Relation]?: boolean;
};

export interface BaseColumnFunctions<
  Tables extends Schema,
  Table extends DrizzleTable,
  Relation extends DrizzleRelations = DrizzleRelations,
> {
  find: (
    options?: FindOptions,
  ) => IFindResult<DrizzleRawOutput<Table>[], Relation>;
  findOne: (
    options?: FindOneOptions,
  ) => IFindResult<DrizzleRawOutput<Table> | null, Relation>;
  insert: <
    Values extends DrizzleInsertValues<Table> = DrizzleInsertValues<Table>,
    Output extends DrizzleRawOutput<Table> = DrizzleRawOutput<Table>,
  >(
    values: Values,
    options?: InsertOptions,
  ) => ModelFunctionResult<Values extends any[] ? Output[] : Output, void>;
}

export type ColumnFunctions<
  Tables extends Schema,
  Table extends DrizzleTable,
  TableColumn extends Column,
  Relation extends DrizzleRelations = DrizzleRelations,
  RelationKeys extends string = string,
> = {
  limit: (value: number) => ColumnFunctions<Tables, Table, TableColumn>;
  offset: (value: number) => ColumnFunctions<Tables, Table, TableColumn>;
  // with: (value: WithValue<Relation>) => ColumnFunctions<Table, TableColumn>;
  // delete: () => void;
} & BaseColumnFunctions<Tables, Table, Relation>;

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

export type ColumnDType<TableColumn extends Column> = DrizzleColumnTypeToType<
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
  Tables extends Schema,
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
  ColumnKeys extends keyof Columns & string = keyof Columns & string,
  Relation extends RelationsBuilderConfigValue = RelationsBuilderConfigValue,
  RelationKeys extends string = string,
> = {
  [ColumnKey in ColumnKeys]: ColumnOptionFn<
    Columns[ColumnKey],
    ColumnFunctions<
      Tables,
      Table,
      Columns[ColumnKey],
      Relation extends undefined ? DrizzleRelations : Relation,
      RelationKeys
    > &
      ModelColumnFunctions<
        Tables,
        Table,
        Columns,
        Exclude<ColumnKeys, ColumnKey>
      >
  >;
};
