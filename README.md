# callbag-state-keyed
[![tests](https://img.shields.io/github/workflow/status/loreanvictor/callbag-state-keyed/Test%20and%20Report%20Coverage?label=tests&logo=mocha&logoColor=green&style=flat-square)](https://github.com/loreanvictor/callbag-state-keyed/actions?query=workflow%3A%22Test+and+Report+Coverage%22)
[![coverage](https://img.shields.io/codecov/c/github/loreanvictor/callbag-state-keyed?logo=codecov&style=flat-square)](https://codecov.io/gh/loreanvictor/callbag-state-keyed)
[![version](https://img.shields.io/npm/v/callbag-state-keyed?logo=npm&style=flat-square)](https://www.npmjs.com/package/callbag-state-keyed)

👉 Key-track [`callbag-state`](https://github.com/loreanvictor/callbag-state)s:

```ts
import state from 'callbag-state';
import keyed from 'callbag-state-keyed';
import subscribe from 'callbag-subscribe';

const s = state([
  { id: 1, name: 'John' },
  { id: 2, name: 'Jack' },
  { id: 3, name: 'Jill' },
]);

const k = keyed(s, p => p.id);
subscribe(console.log)(k.key(2));   // > { id: 2, name: 'Jack' }

s.set([
  { id: 2, name: 'Jack' },
  { id: 3, name: 'Jill' }
]);                                 // --> no changes to id 2, no logs

s.set([
  { id: 2, name: 'Joe' },
  { id: 3, name: 'Jill' }
]);                                 // > { id: 2, name: 'Joe' }
```
[► TRY IT!](https://stackblitz.com/edit/callbag-state-keyed-demo1?devtoolsheight=33&embed=1&file=index.ts)

<br>

👉 Modify key-tracked sub-states:
```ts
const jill = k.key(3);
subscribe(console.log)(jill);       // > { id: 3, name: 'Jill' }
jill.sub('name').set('Jillian');    // > { id: 3, name: 'Jillian' }
```
[► TRY IT!](https://stackblitz.com/edit/callbag-state-keyed-demo1?devtoolsheight=33&embed=1&file=index.ts)

<br>

👉 Track index of a particular key:
```ts
subscribe(console.log)(k.index(2)); // --> index of element with `id: 2`
                                    // > 0
s.set([
  { id: 3, name: 'Jillian' },
  { id: 2, name: 'Joe' }
]);                                 // > 1
```
[► TRY IT!](https://stackblitz.com/edit/callbag-state-keyed-demo1?devtoolsheight=33&embed=1&file=index.ts)

<br>

👉 Get detailed list changes for a keyed list:
```ts
subscribe(console.log)(k.changes());

s.set([
  { id: 4, name: 'Joseph' },
  { id: 3, name: 'Jillian' },
  { id: 1, name: 'John' },
]);

// > {
// >   additions: [
// >     { index: 0, item: { id: 4, name: 'Joseph' } },
// >     { index: 2, item: { id: 1, name: 'John' } },
// >   ],
// >   deletions: [
// >     { index: 1, item: { id: 2, name: 'Joe' } } 
// >   ],
// >   moves: [
// >     { item: { id: 3, name: 'Jillian' }, oldIndex: 0, newIndex: 1 }
// >   ]
// > }
```
[► TRY IT!](https://stackblitz.com/edit/callbag-state-keyed-demo1?devtoolsheight=33&embed=1&file=index.ts)

<br><br>

## Gotchas

Same as [`callbag-state`](https://github.com/loreanvictor/callbag-state#gotchas).

<br><br>

## Contribution

Be nice and respectful, more importantly super open and welcoming to all.

👉 Useful commands for working on this repo:
```bash
git clone https://github.com/loreanvictor/callbag-state-keyed.git
```
```bash
npm i              # --> install dependencies
```
```bash
npm start          # --> run `samples/index.ts`
```
```bash
npm test           # --> run all tests
```
```bash
npm run cov:view   # --> view code coverage
```
