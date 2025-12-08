- Add all essential functions as `update`, `insert`, `delete`, `find`, `findOne`
- Make `route` function (Just duplicate):
```ts
const [val1, val2] = await userModel.name({
  like: "A%"
}).route(
  (userModel) => userModel.isVerified(true).find(),
  (userModel) => userModel.isVerified(false).age({
    lte: 18
  }).find()
  // ...args[]
)
```
- Make built in `paginate` which is pagination function, used as:
```ts
const userModel = model({
  table: userTable,
  
  // Optional
  pagination: {
    max: 10
  }
})

const page = 1;

userModel.name({
  like: "A%"
}).userId(userId).paginate(page)
```
- Make built in `upsert`, as:
```ts
userModel.id(123).upsert({
  // create obj
}, {
  // update obj 
}, /* options */)
```

- Transactions:
```ts
userModel.transaction(tx => ...);

// With other models
userModel.transaction(tx => {
  postsModel.db(tx).create({
    userId: 123,
    content: ...
  })
  
  // or
  
  const txPostsModel = postsModel.db(tx);
  
  txPostsModel.create({
    userId: 123,
    content: ...
  })
  
  txPostsModel.userId(123).delete()
});
```
- Soft delete?
