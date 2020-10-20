import { State, SubState } from 'callbag-state';
import { makeKeyed } from './keyed';
import { HasList, KeyFunc } from './types';


export function keyed<T, U extends HasList<T>, K extends keyof U>(
  state: State<T[]> | SubState<U, K>,
  keyfunc: KeyFunc<T>,
) {
  return makeKeyed(state, keyfunc);
}


export default keyed;
