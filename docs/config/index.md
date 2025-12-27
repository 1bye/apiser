# Config
It's base function which allows to effortlessly use config on different runtimes with same API

Basic usage:
```ts
// server.config.ts
import { config } from "@apiser/config";

export default config({
  // Reads from process.env or Bun.env or Deno and etc...
  baseUrl: "BASE_URL"
});
```


```ts
// server.config.ts
import { config } from "@apiser/config";

export default config({
  baseUrl: {
    key: "string",
    
    // If no `value` is set and no `defaultValue` then will occur error
    defaultValue: "string",
  
    // Schema (zod/typebox/valibot and etc...)
    schema: {},
    
    // Prevents to throw an error when `value` or `defaultValue` is not present
    optional: "boolean",
    
    // If set `true` tries to transform `value` into json object otherwise occur error
    json: "boolean"
  }
}, {
  // Extra options such as runtime
  runtime: "deno" | "bun" | "node" | "cf-workers" // and etc...
});
```
