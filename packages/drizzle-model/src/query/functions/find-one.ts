import type { FindOptions } from "./find";

export type FindOneOptions = Omit<FindOptions, "overrideLimit">;
