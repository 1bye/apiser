export * from "./base";
export * from "./json"
export * from "./meta"
export * from "./error"
export * from "./binary"

import { json } from "./json"
import { meta } from "./meta"
import { error } from "./error"
import { binary } from "./binary"

export const options = {
  json,
  meta,
  error,
  binary
};
