# Transform-able

```ts
// const ix = namespace("IX");

const tags = registry(tag => ({
  "item.name": tag.string().schema(z.string()),
  "item.price_per_unit": null,
  "item.quantity": null,
  "item.total": tag.derive(({ "item.quantity": q, "item.price_per_unit": p }) => q * p)
}));

const Item = collection({
  // Invoice.Xpress Item
  // or [ix("ITEM")]
  "IX.Item": {
    quantity: tags("item.quantity").coerce(String).required(),
    unit_price: tags("item.price_per_unit").number(),
    name: tags("item.name").string(),
    total: tags("item.total")
      // ovveride derive / or set.
      .derive(({ "item.quantity": q, "item.price_per_unit": p }) => (q * p) * 2)
  },
  "Shopify.Item": {
    current_quantity: tags("item.quantity").fallback(),
    quantity: tags("item.quantity", {
      priority: 1,
      read: "preferDefined" | "preferNonEmpty" | "preferHigherPriority",
      // read: coalesce(() => any)
    }).prefer(),
    price: tags("item.price_per_unit")
  },
  "IX.Item@v1": {}
});

const { value: invoiceXpressItem, errors, explain } = Item.transform(payload, {
  from: "Stripe.Item",
  to: "IX.Item",
  explain: true,
  mode: "strict",     // or "warn" | "loose"
});

///////

const Invoice = collection({
  "IX.Invoice": {
    items: Item.arrayOf("IX.Item")
  },
  "Shopify.Order": {
    line_items: Item.arrayOf("Shopify.Item")
  }
})
```
