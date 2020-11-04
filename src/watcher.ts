import { KeyFunc, KeyMap, ListChanges } from './types';


export class Watcher<T> {
  private _keymap: KeyMap<T>;

  constructor(initial: T[] | undefined, readonly keyFunc: KeyFunc<T>) {
    this._keymap = {};
    this.changes(initial);
  }

  changes(list: T[] = []) {
    const changes: ListChanges<T> = {
      additions: [],
      deletions: [],
      moves: [],
    };

    const keymap: KeyMap<T> = {};
    for (let index = 0, item = list[index]; index < list.length; item = list[++index]) {
      const _key = this.keyFunc(item);
      keymap[_key] = { index, item };

      if (!(_key in this._keymap)) {
        changes.additions.push({ index, item });
      }
    }

    for (
      let entries = Object.entries(this._keymap), i = 0, _e = entries[i];
      i < entries.length;
      _e = entries[++i]
    ) {
      const [_key, entry] = _e;
      if (!(_key in keymap)) {
        changes.deletions.push(entry);
      } else {
        const _newEntry = keymap[_key];
        if (_newEntry.index !== entry.index) {
          changes.moves.push({
            oldIndex: entry.index,
            newIndex: _newEntry.index,
            item: entry.item
          });
        }
      }
    }

    this._keymap = keymap;

    return changes;
  }

  public get keymap() { return this._keymap; }
}
