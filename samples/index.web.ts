import { keyed } from '../src';
import state from 'callbag-state';
import subscribe from 'callbag-subscribe';

const btn = document.createElement('button');
btn.textContent = 'CLICK ME!';
document.body.append(btn);

const l: number[] = [];
const count = 1000;

const s = keyed(state(l), i => i);
const S: any[] = [];
const I: any[] = [];

function add() {
  const l2: number[] = [];
  const L = s.get().length;

  for (let i = 0; i < count; i++) {
    l2.push(L + i);
  }

  s.set(s.get().concat(l2));

  for (let i = 0; i < count; i++) {
    // const _s = s.key(L + i);
    const _i = s.index(L + i);
    // _s(0, () => {});
    // subscribe(() => {})(_s);
    // S.push(_s);
    I.push(_i);
  }
}

btn.addEventListener('click', add);
