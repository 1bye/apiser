# TODO:

- DONE TYPES => `count()` function to count rows
- DONE => Fix types. On insert, and add Simplify<> = for more readable queries.
- DONE TYPES => add `returnFirst()` to return first of `return()`
- DONE TYPES => add `omit()` as progammic `exclude()`. The main difference is `omit()` is applied after query. `exclude()` is applied on the query.
- JUST remake a entire core. Manually write code with a few AI changes.
- DONE TYPES => Add `safe()`:
```ts
const { data: user, error } = userModel.findFirst().safe();
```
