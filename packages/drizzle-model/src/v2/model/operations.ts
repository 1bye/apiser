import type { DrizzleColumnDataType } from "@/types";
import type { Column } from "drizzle-orm";

export type ColumnOpsBase<T> = {
	equal?: T;
	not?: T;
	in?: T[];
	nin?: T[];
	isNull?: boolean;
};

export type NumberOps = {
	gt?: number;
	gte?: number;
	lt?: number;
	lte?: number;
	between?: [number, number];
	notBetween?: [number, number];
};

export type StringOps = {
	like?: string;
	ilike?: string;
	startsWith?: string;
	endsWith?: string;
	contains?: string;
	regex?: string;
	notRegex?: string;
	length?: NumberOps;
};

export type BoolOps = {
	isTrue?: boolean;
	isFalse?: boolean;
};

export type DateOps = {
	before?: Date | string;
	after?: Date | string;
	on?: Date | string;
	notOn?: Date | string;
	between?: [Date | string, Date | string];
};

export type JsonOps<T> = {
	has?: T;
	hasAny?: T[];
	hasAll?: T[];
	len?: NumberOps;
};

export type LogicalOps<TColumn extends Column> = {
	or?: ColumnValue<TColumn>[];
	and?: ColumnValue<TColumn>[];
};

export type TypeOps<T> = T extends number
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

export type ColumnOps<
	TColumn extends Column,
	TDataType extends DrizzleColumnDataType<TColumn>,
> = ColumnOpsBase<TDataType> & TypeOps<TDataType> & LogicalOps<TColumn>;

export type ColumnValue<
	TColumn extends Column,
	TDataType extends
		DrizzleColumnDataType<TColumn> = DrizzleColumnDataType<TColumn>,
> = TDataType | ColumnOps<TColumn, TDataType>;
