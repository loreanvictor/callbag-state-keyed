import { Sink } from 'callbag';
import {
  State, SubState, broadcast, MsgType, _Start, _Data, _End, isLeaf, Change, ChangeTrace, trace, makeState
} from 'callbag-state';
import { keyDownstream, keyUpstream } from './keystream';
import { HasList, KeyedChangeStream, KeyedState, KeyFunc, ListChanges } from './types';
import { Watcher } from './watcher';


export function makeKeyed<T, U extends HasList<T>, K extends keyof U>(
  state: State<T[]> | SubState<U, K>,
  keyfunc: KeyFunc<T>,
): KeyedState<T> {
  const sinks: Sink<[Change<T[]>, ListChanges<T>]>[] = [];
  let talkback: any = undefined;
  let value: T[] = state.get() || [];

  const watcher = new Watcher(value, keyfunc);

  const terminate = (err?: any) => {
    broadcast(_End, err, sinks);
    sinks.length = 0;
    if (talkback) {
      talkback(_End);
      talkback = undefined;
    }
  };

  state.downstream()(_Start, (t: MsgType, _m?: any) => {
    if (t === _Start) { talkback = _m; }
    else if (t === _Data) {
      let change = _m as Change<T[]>;
      const listChanges = watcher.changes(change.value);

      // retrace moved elements
      if (listChanges.moves.length > 0 && !isLeaf(change.trace)) {
        const mapping = listChanges.moves.reduce((total, move) => {
          total[move.oldIndex] = move.newIndex;
          return total;
        }, <{[src: number]: number}>{});
        const _tr: ChangeTrace<T[]> = {subs:  { ... change.trace.subs } };
        Object.entries(mapping).forEach(([src, dest]) => {
          const subtrace = trace(value[src as any], change.value!![dest]);
          if (subtrace) {
            (_tr.subs as any)[dest] = subtrace;
          }
          else {
            delete (_tr.subs as any)[dest];
          }
        });
        change = {
          value: change.value,
          trace: _tr
        };
      }

      value = change.value || [];
      broadcast(_Data, [change, listChanges], sinks);
    } else if (t === _End) { terminate(_m); }
  });

  const _changes: KeyedChangeStream<T> = (type: MsgType, m?: any) => {
    if (type === _Start) {
      const sink = m as Sink<[Change<T[]>, ListChanges<T>]>;
      sinks.push(sink);

      sink(_Start, (t: MsgType) => {
        if (t === _End) {
          const index = sinks.indexOf(sink);
          if (index >= 0) { sinks.splice(index, 1); }
        }
      });
    }
  };

  const _state = (type: MsgType, m?: any) => {
    if (type === _Start) {
      const sink = m as Sink<T[] | undefined>;
      _changes(_Start, (t: MsgType, _m?: any) => {
        if (t === _Start) { sink(_Start, _m); sink(_Data, value); }
        else if (t === _Data) { sink(_Data, _m[0].value || []); }
        else if (t === _End) { sink(_End, _m); }
      });
    } else if (type === _Data) {
      state.upstream()(_Data, { value: m, trace: { from: value as any, to: m }});
    } else if (type === _End) {
      terminate(m);
      state.upstream()(type, m);
    }
  };

  const _index = (key: number | string) => (type: MsgType, m?: any) => {
    if (type !== _Start) { return; }
    const sink = m as Sink<number>;
    let last: number | undefined = watcher.keymap[key]?.index;
    _changes(_Start, (t: MsgType, _m?: any) => {
      if (t === _Start) { sink(_Start, _m); sink(_Data, watcher.keymap[key]?.index); }
      else if (t === _Data) {
        const index = watcher.keymap[key]?.index;
        if (index !== last) {
          sink(_Data, index);
          last = index;
        }
      }
      else if (t === _End) { sink(_End, _m); }
    });
  };

  _state.get = () => value;
  _state.set = (t: T[]) => _state(_Data, t);
  _state.clear = () => _state(_End);
  _state.index = _index;

  _state.changes = () => (type: MsgType, m?: any) => {
    if (type !== _Start) { return; }
    const sink = m as Sink<ListChanges<T>>;
    _changes(_Start, (t: MsgType, _m?: any) => {
      if (t === _Data) { sink(_Data, _m[1]); }
      else { sink(t as any, _m); }
    });
  };

  _state.key = (k: string | number) => {
    const _sub: SubState<T[], number> = makeState(
      watcher.keymap[k]?.item,
      keyDownstream(_changes, k, watcher, () => _sub.get()),
      keyUpstream(state.upstream() as any, k, watcher, value),
    );

    return _sub;
  };

  return _state;
}
