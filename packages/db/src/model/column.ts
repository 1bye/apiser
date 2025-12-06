import type {
  DrizzleColumn,
  DrizzleColumns,
  DrizzleDataType,
  DrizzleTable,
} from "./types";
import { capitalize } from "./utils";

export type ColumnFunctions<
  Table extends DrizzleTable,
  Column extends DrizzleColumn<Table> = DrizzleColumn<Table>,
> = {
  findBy: (by: DrizzleDataType<Column["dataType"]>) => void;
};

export type ColumnFunctionDict<
  Table extends DrizzleTable,
  Keys extends string,
  CFKeys extends keyof ColumnFunctions<Table> & string =
    keyof ColumnFunctions<Table>,
> = {
  [CFKey in CFKeys as ColumnFunctionName<
    Table,
    Keys,
    CFKey
  >]: ColumnFunctions<Table>[CFKey];
};

export type ColumnFunctionName<
  Table extends DrizzleTable,
  Keys extends string,
  CFKey extends keyof ColumnFunctions<Table> & string,
> = Keys extends Keys
  ? CFKey extends CFKey
    ? `${CFKey}${Capitalize<Keys>}`
    : never
  : never;

export type ModelColumnFunctions<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table>,
  Keys extends keyof Columns & string,
  CFKeys extends keyof ColumnFunctions<Table> & string =
    keyof ColumnFunctions<Table>,
> = ColumnFunctionDict<Table, Keys, CFKeys>;

export function createColumnFunctions<
  Table extends DrizzleTable,
  Columns extends DrizzleColumns<Table> = DrizzleColumns<Table>,
  ColumnKeys extends keyof DrizzleColumns<Table> & string =
    keyof DrizzleColumns<Table> & string,
>(columns: Columns): ModelColumnFunctions<Table, Columns, ColumnKeys> {
  const values = Object.values(columns).map((column) =>
    createColumnFunction(column),
  );

  return Object.assign({}, ...values);
}

export function createColumnFunction<
  Table extends DrizzleTable,
  Column extends DrizzleColumn<Table> = DrizzleColumn<Table>,
  ColumnName extends Column["name"] = Column["name"],
  CFKeys extends keyof ColumnFunctions<Table> & string =
    keyof ColumnFunctions<Table>,
  Output extends ColumnFunctionDict<Table, ColumnName, CFKeys> =
    ColumnFunctionDict<Table, ColumnName, CFKeys>,
>(column: Column): Output {
  const name = column.name as ColumnName;
  const capitalizedName = capitalize(name) as Capitalize<ColumnName>;

  // const findByName: ColumnFunctionName<ColumnName, "findBy"> =
  //   `findBy${capitalizedName}`;

  return {
    [`findBy${capitalizedName}`]: () => {
      console.log({
        capitalizedName,
        columnType: column.dataType,
      });
    },
  } as unknown as Output;
}
