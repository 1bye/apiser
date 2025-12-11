import type { Column, RelationsBuilderConfigValue } from "drizzle-orm";
import type {
  DrizzleRawOutput,
  DrizzleColumns,
  DrizzleColumnTypeToType,
  DrizzleTable,
  DrizzleInsertValues,
  DrizzleRelations,
  DrizzleSchema,
} from "@/types";
import type { ModelFunctionResult } from "@/promise";
import type { FindOptions, IFindResult } from "@/query/functions/find";
import type { FindOneOptions } from "@/query/functions/find-one";
import type { InsertOptions } from "@/query/functions/insert";

export interface BaseColumnFunctions<
  Table extends DrizzleTable,
  Tables extends DrizzleSchema,
  Relation extends DrizzleRelations = DrizzleRelations,
> {
  find: (
    options?: FindOptions,
  ) => IFindResult<Table, Tables, Relation, DrizzleRawOutput<Table>[]>;
  findOne: (
    options?: FindOneOptions,
  ) => IFindResult<Table, Tables, Relation, DrizzleRawOutput<Table> | null>;
  insert: <
    Values extends DrizzleInsertValues<Table> = DrizzleInsertValues<Table>,
    Output extends DrizzleRawOutput<Table> = DrizzleRawOutput<Table>,
  >(
    values: Values,
    options?: InsertOptions,
  ) => ModelFunctionResult<Values extends any[] ? Output[] : Output, void>;
}

export type ColumnFunctions<
  Table extends DrizzleTable,
  Tables extends DrizzleSchema,
  TableColumn extends Column,
  Relation extends DrizzleRelations = DrizzleRelations,
  RelationKeys extends string = string,
> = {
  limit: (value: number) => ColumnFunctions<Table, Tables, TableColumn>;
  offset: (value: number) => ColumnFunctions<Table, Tables, TableColumn>;
  // with: (value: WithValue<Relation>) => ColumnFunctions<Table, TableColumn>;
  // delete: () => void;
} & BaseColumnFunctions<Table, Tables, Relation>;

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
  Table extends DrizzleTable,
  Tables extends DrizzleSchema,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
  ColumnKeys extends keyof Columns & string = keyof Columns & string,
  Relation extends DrizzleRelations = DrizzleRelations,
> = {
  [ColumnKey in ColumnKeys]: ColumnOptionFn<
    Columns[ColumnKey],
    ColumnFunctions<Table, Tables, Columns[ColumnKey], Relation> &
      ModelColumnFunctions<
        Table,
        Tables,
        Columns,
        Exclude<ColumnKeys, ColumnKey>,
        Relation
      >
  >;
};
