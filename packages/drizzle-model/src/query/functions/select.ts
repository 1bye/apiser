import type {
  DrizzleRawOutput,
  DrizzleTable,
  DrizzleVariativeRawOutput,
} from "@/types";

export type SelectValue<Table extends DrizzleTable> = {
  [Key in keyof DrizzleRawOutput<Table>]?: boolean;
};

export type ResolveSelectedValues<
  Table extends DrizzleTable,
  Value extends SelectValue<Table>,
  Result extends DrizzleVariativeRawOutput<Table>,
> =
  Result extends DrizzleRawOutput<Table>
    ? {
        // single row
        [Key in keyof Value as Value[Key] extends true
          ? Key & string
          : never]: Result[Key & string];
      }
    : Result extends DrizzleRawOutput<Table>[]
      ? {
          // array of rows
          [Key in keyof Value as Value[Key] extends true
            ? Key & string
            : never]: Result[number][Key & string];
        }[]
      : null;
