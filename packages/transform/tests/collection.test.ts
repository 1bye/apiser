import { collection } from "@/collection";
import { registry } from "@/registry";
import { z } from "@apiser/zod";
import { test } from "bun:test";

test.skip("collection type check", () => {
  const tags = registry(
    tag => ({
      // item:
      "item.name": tag.string().required(),
      "item.quantity": tag.number(),
      "item.price": tag.number(),
      // customer:
      "customer.first_name": tag.string().max(100),
      "customer.last_name": tag.string().max(100),
      "customer.name": tag.string().max(200),
      "customer.email": tag.string(),
      "customer.fiscal_id": tag.string(),
      "customer.address": tag.string().max(200),
      "customer.postal_code": tag.string().max(50),
      "customer.country": tag.string().max(100),
      "customer.code": tag.string().max(200),
      "customer.city": tag.string().max(100),
      "customer.phone": tag.string().max(50),
      "customer.province": tag.string(),
    })
  )
    .derive("customer.name", ({ "customer.first_name": a, "customer.last_name": b }) => `${a} ${b}`, { when: "missing" })
    .derive("customer.first_name", ({ "customer.name": a }) => a.split(" ")?.[0] ?? a, { when: "missing" });

  const Customer = collection({
    "IX.Client": {
      name: tags("customer.name"),
      email: tags("customer.email"),
      fiscal_id: tags("customer.fiscal_id"),
      address: tags("customer.address"),
      postal_code: tags("customer.postal_code"),
      country: tags("customer.country"),
      code: tags("customer.code"),
      city: tags("customer.city"),
      phone: tags("customer.phone")
    },
    "Shopify.Customer": {
      first_name: tags("customer.first_name"),
      last_name: tags("customer.last_name"),
      email: tags("customer.email"),
      phone: tags("customer.phone"),
      default_address: {
        first_name: tags("customer.first_name"),
        last_name: tags("customer.last_name"),
        address1: tags("customer.address"),
        address2: tags("customer.fiscal_id"),
        city: tags("customer.city"),
        province: tags("customer.province"),
        country: tags("customer.country"),
        zip: tags("customer.postal_code"),
        phone: tags("customer.phone"),
        name: tags("customer.name"),
      }
    }
  })

  const Item = collection({
    "IX.Item": {
      name: tags("item.name")
    }
  });
})
