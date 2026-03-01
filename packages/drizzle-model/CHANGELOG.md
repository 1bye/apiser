# Change log

## 2.0.1 | 01-03-2026
- mark `pg` as peerDep
- add `CHANGELOG.md`
- add `relations.test.ts` to test relations
- add `SimplifyDeep<>` from `type-fest` in queries, for better DX of using relations
- fix relations `include()` function

## 2.0.0 | 28-02-2026
- add `REAMDE.md`
- add `count()` function
- add `Simplify<>` to all queries
- add `returnFirst()` and make `return()` to return array of rows
- add `omit()` as transformator after `return()/returnFirst()`
- remake entire core, better JSDoc, OOP over functional, and much more...
- remake all tests
- add `safe()` function
```ts
const { data: user, error } = userModel.findFirst().safe();
```
- and in overall just make better DX
