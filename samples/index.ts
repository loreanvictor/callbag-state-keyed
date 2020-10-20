// tslint:disable: no-magic-numbers

import state from 'callbag-state';
import subscribe from 'callbag-subscribe';
import pipe from 'callbag-pipe';

import { keyed } from '../src';

const s = state([1, 2]);
const k = keyed(s, n => n);

pipe(
  k.index(2),
  subscribe(console.log)
);

s.set([2, 1]);
s.set([1, 3, 2]);
s.set([1, 3]);
