// tslint:disable: no-magic-numbers

import state from 'callbag-state';
import map from 'callbag-map';
import subscribe from 'callbag-subscribe';
import pipe from 'callbag-pipe';

import { keyed } from '../src';

const s = state([1, 2]);
const k = keyed(s, n => n);

pipe(
  k.key(2),
  // map(x => x!! * 2),
  subscribe(console.log)
);

s.get().splice(1, 1);
s.set(s.get());
