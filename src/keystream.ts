import { Sink, START } from 'callbag';
import { Change, ChangeTraceNode, Downstream, isLeaf, MsgType, Upstream, _Data, _End, _Start } from 'callbag-state';
import { KeyedChangeStream } from './types';
import { Watcher } from './watcher';


function _keyDownSinkWrap<T>(
  key: string | number,
  sink: Sink<Change<T>>,
  watcher: Watcher<T>,
  current: () => T | undefined,
  t: MsgType, m?: any,
) {
  if (t === _Data) {
    const change = m[0] as Change<T[]>;
    const entry = watcher.keymap[key];

    if ((isLeaf(change.trace) && current() !== entry?.item)
      || (!isLeaf(change.trace) && (
            (!entry && !!current()) ||
            (entry && entry.index in change.trace.subs)
      ))
    ) {
      sink(_Data, {
        value: entry?.item,
        trace: isLeaf(change.trace) || !entry ?
                undefined :
                ((change.trace as ChangeTraceNode<T>).subs as any)[entry.index]
      });
    }
  } else { sink(t as any, m); }
}

export function keyDownstream<T>(
  src: KeyedChangeStream<T>,
  key: string | number,
  watcher: Watcher<T>,
  current: () => T | undefined,
):  Downstream<T> {
  return ((start: START, sink: Sink<Change<T>>) => {
    /*istanbul ignore if*/if (start !== _Start) { return; }
    src(_Start, _keyDownSinkWrap.bind(null, key, sink, watcher, current));
  }) as any;
}


export function keyUpstream<T>(
  src: Upstream<T[]>,
  key: string | number,
  watcher: Watcher<T>,
  ref: () => T[],
): Upstream<T> {
  return (type: MsgType, m?: any) => {
    if (type === _Data) {
      const change = m as Change<T>;
      const entry = watcher.keymap[key];
      const _ref = ref();
      _ref[entry.index] = change.value!!;

      src(_Data, {
        value: _ref,
        trace: {
          subs: {
            [entry.index]: change.trace
          }
        }
      });
    } else/*istanbul ignore else*/if (type === _End && m) {
      src(_End, m);
    }
  };
}
