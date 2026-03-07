# TODO:

- DONE => `count()` function to count rows
- DONE => Fix types. On insert, and add Simplify<> = for more readable queries.
- DONE => add `returnFirst()` to return first of `return()`
- DONE => add `omit()` as progammic `exclude()`. The main difference is `omit()` is applied after query. `exclude()` is applied on the query.
- DONE JUST remake a entire core. Manually write code with a few AI changes.
- DONE => Add `safe()`:
```ts
const { data: user, error } = userModel.findFirst().safe();
```
- on `findFirst()` types return value with undefined as `{} | undefined`
- add `orderBy()` function
- add `select()` before the `findMany()` and `findFirst()`
- add `limit()` function
