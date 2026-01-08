```ts
userModel.upsert({
  insert: {
  
  },
  update: {
  
  },
  // options:
  // updateWhere()
  // target by default is all primary keys, but can be overided
})

// OR idk...

userModel.upsert({
  // insert
}, {
  // update
}, {
  // options
})
```

if exlcuded:
```ts
products.upsert({
  insert: {
  
  }, // or [],
  update: (c) => ({
    // c.excluded and maybe some alias like "exc()", or "original()" or "inserted()" idk
    price: c.excluded("price"),
    stock: c.excluded("stock"),
    lastUpdated: c.excluded("lastUpdated")
  }),
  // options:
  // updateWhere()
  // target
  
  updateWhere: (c) => ({
    stock: {
      not: c.exlcuded("stock")
    },
    price: {
      not: c.exlcuded("price")
    }
  })
})
```
