import { Callbag, Source } from 'callbag';
import { Change, MsgType, State, SubState } from 'callbag-state';
import { Watcher } from './watcher';

export type KeyFunc<T> = (t: T) => number | string;

export type KeyMap<T> = {[key: string]: { index: number; item: T }};

export type Addition<T> = {
  index: number;
  item: T;
};

export type Deletion<T> = {
  index: number;
  item: T;
};

export type Move<T> = {
  oldIndex: number;
  newIndex: number;
  item: T;
};

export type ListChanges<T> = {
  additions: Addition<T>[];
  deletions: Deletion<T>[];
  moves: Move<T>[];
};

export type KeyedChangeStream<T> = Source<[Change<T[]>, ListChanges<T>]>;

export type KeyedStateMsgType = MsgType | typeof _Latest | typeof _KeyChangeStream | typeof _Watcher;

export type KeyedState<T> = Callbag<T[], T[]> & {
  get(): T[];
  set(t: T[]): void;
  clear(): void;
  keyfunc: (t: T) => string | number;
  state: State<T[]>;
  changestream: KeyedChangeStream<T>;
  watcher: Watcher<T>;
  changes(): Source<ListChanges<T>>;
  index(k: string | number): Source<number> & { get(): number | undefined };
  key(k: string | number): SubState<T[], number>;
};


/* istanbul ignore next */
export function isKeyedState<T>(cb: Source<T[]>): cb is KeyedState<T> {
  return cb && typeof cb === 'function' && cb.length === 2
    && (cb as any).get && typeof (cb as any).get === 'function' && (cb as any).get.length === 0
    && (cb as any).set && typeof (cb as any).set === 'function' && (cb as any).set.length === 1
    && (cb as any).clear && typeof (cb as any).clear === 'function' && (cb as any).clear.length === 0
    && (cb as any).index && typeof (cb as any).index === 'function' && (cb as any).index.length === 1
    && (cb as any).changes && typeof (cb as any).changes === 'function' && (cb as any).changes.length === 1
    && (cb as any).keyfunc && typeof (cb as any).keyfunc === 'function' && (cb as any).keyfunc.length === 1
    ;
}

export const _Latest = 100;
export const _KeyChangeStream = 201;
export const _Watcher = 202;
