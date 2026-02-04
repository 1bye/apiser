import { registry } from "@/registry";
import { z } from "@apiser/zod";
import { test } from "bun:test";

test.skip("registry type check", () => {
  const tags = registry(
    tag => ({
      "item.name": tag.string().required(),
      "item.quantity": tag.number(),
      "item.price": tag.number(),
    })
  )
    .derive("item.total", ({ "item.price": a, "item.quantity": b }) => a * b);

  tags("item.total");
})
