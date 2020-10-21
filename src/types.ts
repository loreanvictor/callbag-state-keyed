import { Sink, Source } from 'callbag';
import { Change, SubState } from 'callbag-state';

export type HasList<T> = {[k: string]: Array<T>} & {[k: number]: Array<T>};

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

export type KeyedState<T> = Source<T[]> & Sink<T[]> & {
  get(): T[];
  set(t: T[]): void;
  clear(): void;
  changes(): Source<ListChanges<T>>;
  index(k: string | number): Source<number>;
  key(k: string | number): SubState<T[], number>;
};

