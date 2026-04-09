# Change log

## 2.0.6 | 09-04-2026
- add `orderBy()`
- fix a lot of bugs from production code that I've had.

## 2.0.5 | 03-03-2026
- bypass undefined values in `esc()`

## 2.0.4 | 02-03-2026
- Fix custom methods execution error
- Add custom methods tests

## 2.0.3 | 02-03-2026
- I forgot to rebuild package in `2.0.2 to 2.0.0`, damn

## 2.0.2 | 01-03-2026
- add `esc.*()` operations
- update README.md with new `esc.*()`

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
