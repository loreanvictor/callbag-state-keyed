import { Sink } from 'callbag';
import {
  State, SubState, broadcast, MsgType, _Start, _Data, _End, isLeaf, Change, ChangeTrace, trace, makeState, StateLike
} from 'callbag-state';
import { keyDownstream, keyUpstream } from './keystream';
import {
  KeyedChangeStream, KeyedState, KeyedStateMsgType,
  KeyFunc, ListChanges, _KeyChangeStream, _Latest, _Watcher
} from './types';
import { Watcher } from './watcher';


function terminate<T>(sinks: Sink<[Change<T[]>, ListChanges<T>]>[], talkback: any, err?: any) {
  broadcast(_End, err, sinks);
  sinks.length = 0;
  if (talkback) {
    talkback(_End);
  }
}


function get<T>(this: KeyedState<T>) { return this(_Latest as any) as any as T[]; }
function set<T>(this: KeyedState<T>, t: T[]) { this(_Data, t); }
function clear<T>(this: KeyedState<T>) { this(_End); }

function indexGreeter<T>(
  this: KeyedState<T>,
  k: number | string,
  sink: Sink<number>,
  bag: { last: number | undefined },
  t: MsgType, _m?: any
) {
  if (t === _Start) { sink(_Start, _m); sink(_Data, this.watcher.keymap[k]?.index); }
  else if (t === _Data) {
    const _index = this.watcher.keymap[k]?.index;
    if (_index !== bag.last) {
      sink(_Data, _index);
      bag.last = _index;
    }
  }
  else/*istanbul ignore else*/if (t === _End) { sink(_End, _m); }
}

function indexGet(this: any) { return this(_Latest) as number; }

function index<T>(this: KeyedState<T>, k: number | string) {
  // let last: number | undefined = this.watcher.keymap[k]?.index;
  const bag = { last: this.watcher.keymap[k]?.index };
  const src = (type: MsgType | typeof _Latest, m?: any) => {
    if (type === _Latest) { return bag.last; }
    /*istanbul ignore if*/if (type !== _Start) { return; }
    const sink = m as Sink<number>;
    this.changestream(_Start, indexGreeter.bind(this, k, sink, bag));
  };

  src.get = indexGet;
  return src;
}

function changes<T>(this: KeyedState<T>) {
  return (type: MsgType, m?: any) => {
    /*istanbul ignore if*/if (type !== _Start) { return; }
    const sink = m as Sink<ListChanges<T>>;
    this.changestream(_Start, (t: MsgType, _m?: any) => {
      if (t === _Data) { sink(_Data, _m[1]); }
      else { sink(t as any, _m); }
    });
  };
}

function key<T>(this: KeyedState<T>, k: string | number) {
  const _sub: SubState<T[], number> = makeState(
    this.watcher.keymap[k]?.item,
    keyDownstream(this.changestream, k, this.watcher, () => _sub.get()),
    keyUpstream(this.state.upstream() as any, k, this.watcher, () => this.get()),
  );

  return _sub;
}


interface Profile<T> {
  state: StateLike<T[]>;
  sinks: Sink<[Change<T[]>, ListChanges<T>]>[];
  talkback: any;
  value: T[];
  watcher: Watcher<T>;
}

function _changes<T>(
  this: Profile<T>, type: MsgType, m?: any
) {
  /* istanbul ignore else */
  if (type === _Start) {
    const sink = m as Sink<[Change<T[]>, ListChanges<T>]>;
    this.sinks.push(sink);
    // TODO: we can perhaps keep track of keyed sinks (sinks listening for a particular key)
    //       more efficiently, so changes are broadcast to them properly by accessing them via
    //       a hash table. this helps performance of cases with large fan-out (like big arrays).

    sink(_Start, (t: MsgType) => {
      if (t === _End) {
        const _index = this.sinks.indexOf(sink);

        /*istanbul ignore else*/
        if (_index >= 0) { this.sinks.splice(_index, 1); }
        if (this.sinks.length === 0) { terminate(this.sinks, this.talkback); this.talkback = undefined; }
      }
    });

    if (this.sinks.length === 1) {
      this.state.downstream()(_Start, (t: MsgType, _m?: any) => {
        if (t === _Start) { this.talkback = _m; }
        else if (t === _Data) {
          let change = _m as Change<T[]>;
          const listChanges = this.watcher.changes(change.value);

          if (listChanges.moves.length > 0 && !isLeaf(change.trace)) {
            const _tr: ChangeTrace<T[]> = {subs:  { ... change.trace.subs } };
            for (
              let i = 0, move = listChanges.moves[i];
              i < listChanges.moves.length;
              move = listChanges.moves[++i]
            ) {
              const src = move.oldIndex; const dest = move.newIndex;
              const subtrace = trace(this.value[src], change.value!![dest]);
              if (subtrace) {
                (_tr.subs as any)[dest] = subtrace;
              } else {
                delete (_tr.subs as any)[dest];
              }
            }

            change = {
              value: change.value,
              trace: _tr
            };
          }

          this.value = change.value || [];
          broadcast(_Data, [change, listChanges], this.sinks);
        } else/*istanbul ignore else*/if (t === _End) {
          terminate(this.sinks, this.talkback, _m);
          this.talkback = undefined;
        }
      });
    }
  }
}


function _state<T>(
  this: Profile<T>, _c: KeyedChangeStream<T>, type: KeyedStateMsgType, m?: any
) {
  if (type === _Start) {
    const sink = m as Sink<T[] | undefined>;
    _c(_Start, (t: MsgType, _m?: any) => {
      if (t === _Start) { sink(_Start, _m); sink(_Data, this.value); }
      else if (t === _Data) { sink(_Data, _m[0].value || []); }
      else/*istanbul ignore else*/if (t === _End) { sink(_End, _m); }
    });
  } else if (type === _Data) {
    this.state.upstream()(_Data, { value: m, trace: { from: this.value as any, to: m }});
  } else/*istanbul ignore else*/if (type === _End) {
    terminate(this.sinks, this.talkback, m);
    this.talkback = undefined;
    this.state.upstream()(type, m);
  }
  else if (type === _Latest) { return this.value; }
  else if (type === _KeyChangeStream) { return _changes; }
  else if (type === _Watcher) { return this.watcher; }
}


export function makeKeyed<T>(
  state: StateLike<T[]>,
  keyfunc: KeyFunc<T>,
): KeyedState<T> {
  const initial = state.get() || [];
  const profile: Profile<T> = {
    state,
    sinks: [],
    talkback: undefined,
    value: initial,
    watcher: new Watcher(initial, keyfunc),
  };
  const _c = _changes.bind(profile);
  const _s = _state.bind(profile, _c);

  _s.get = get; _s.set = set; _s.clear = clear;
  _s.changestream = _c; _s.watcher = profile.watcher;
  _s.keyfunc = keyfunc; _s.state = state as State<T[]>;
  _s.index = index; _s.changes = changes; _s.key = key;

  return _s;
}
