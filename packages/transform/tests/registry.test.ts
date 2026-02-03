import { registry } from "@/registry";
import { test } from "bun:test";

test.skip("registry type check", () => {
  const tags = registry(tag => ({
    "item.name": tag.string(),
    "item.price": tag.number()
  }));

  tags("item.price");
})
