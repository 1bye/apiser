```ts
transaction([userModel, postsModel], ([model, posts]) => {
  model.insert({
    name: "123"
  })
})

userModel.$transaction((model, tx) => {
  model.insert({
    name: "123"
  })
})

export const transaction = transactionBuilder({
  models: {
    user: userModel
  }
})

transaction((tx) => {
  const result = tx.user
    .id(123)
    .name("Me")
    .$update({
      name: "Not me"
    })
    .return({ 
      id: true 
    })
})


```
