import { StateLike } from 'callbag-state';
import { makeKeyed } from './keyed';
import { KeyFunc } from './types';

export {
  Addition, Deletion, Move, ListChanges,
  KeyFunc, KeyedChangeStream,
  KeyedState, isKeyedState,
} from './types';

export function keyed<T>(
  state: StateLike<T[]>,
  keyfunc: KeyFunc<T>,
) {
  return makeKeyed(state, keyfunc);
}


export default keyed;
export { Watcher } from './watcher';
