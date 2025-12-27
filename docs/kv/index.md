# KV


Basic usage:
```ts
import { kv } from "@apiser/kv";
import { cloudflare } from "@apiser/cloudflare-kv"

export default kv(cloudflare, {
  // extra options
});

// Then

kv.get("key");
kv.getObject("");

kv.put("key", "value", options);
kv.set("key", "value", options);

// Extend
const extended = kv.extend({
  prefix: "api:",
});

extended.getObject("key")

// Extend with base types
type SpecialType = {
  some_cool_value: boolean;
}

const extended = kv.extend<string, SpecialType>({
  prefix: "api:",
});

// `value` is `SpecialType`
const value = extended.getObject("key")
```

KV with different types per key:
```ts
import { kv, type KeyValueTypes } from "@apiser/kv";
import { cloudflare } from "@apiser/cloudflare-kv"

type KeyTypes = KeyValueTypes<{
  "api:": boolean;
  "name": string;
  "obj": {}
}>

const k = kv<KeyTypes>(cloudflare)

// boolean
k.get("api:")
k.get("api:time")

// and etc...
```




```ts
import { kv } from "@apiser/kv";
import { upstash } from "@apiser/upstash-kv"

// Redis
const k = kv(upstash)

// only redis specific functions
k.
```
