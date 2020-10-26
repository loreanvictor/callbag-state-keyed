# callbag-state-keyed
[![tests](https://img.shields.io/github/workflow/status/loreanvictor/callbag-state-keyed/Test%20and%20Report%20Coverage?label=tests&logo=mocha&logoColor=green&style=flat-square)](https://github.com/loreanvictor/callbag-state-keyed/actions?query=workflow%3A%22Test+and+Report+Coverage%22)
[![coverage](https://img.shields.io/codecov/c/github/loreanvictor/callbag-state-keyed?logo=codecov&style=flat-square)](https://codecov.io/gh/loreanvictor/callbag-state-keyed)
[![version](https://img.shields.io/npm/v/callbag-state-keyed?logo=npm&style=flat-square)](https://www.npmjs.com/package/callbag-state-keyed)

Key-track [`callbag-state`](https://github.com/loreanvictor/callbag-state)s:

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
subscribe(console.log)(k.key(2));  // > { id: 2, name: 'Jack' }

s.set([
  { id: 2, name: 'Jack' },
  { id: 3, name: 'Jill' }
]);                                // --> no changes to id 2, no logs

s.set([{ id: 2, name: 'Joe' }]);   // > { id: 2, name: 'Joe' }
```
