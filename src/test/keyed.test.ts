// tslint:disable: max-file-line-count
// tslint:disable: no-magic-numbers
// tslint:disable: no-unused-expression

import { should, expect } from 'chai'; should();

const makeSubject = require('callbag-subject');
import subscribe from 'callbag-subscribe';
import pipe from 'callbag-pipe';
import { state, makeState } from 'callbag-state';

import { keyed } from '../index';
import { ListChanges } from '../types';


describe('keyed', () => {

  it('should emit initial value as well.', done => {
    const s = state([1, 2, 3, 4, 5]);
    const k = keyed(s, n => n);
    subscribe(v => {
      expect(v).to.eql([1, 2, 3, 4, 5]);
      done();
    })(k);
  });

  it('should default to empty array when initialized with undefined state.', done => {
    const s = state([]);
    const k = keyed(s.sub('' as any) as any, n => n as any);
    subscribe(v => {
      expect(v).to.eql([]);
      done();
    })(k);
  });

  it('should also revert to empty array when proxy value changes to undefined.', () => {
    const r: any[] = [];
    const s = state([1, 2, 3, 4]);
    const k = keyed(s, n => n);
    subscribe(v => r.push(v))(k);
    s.set(undefined as any);
    expect(k.get()).to.eql([]);
    r.should.eql([[1, 2, 3, 4], []]);
  });

  it('should emit the proper initial value.', done => {
    const s = state([1, 2, 3, 4, 5]);
    const k = keyed(s, n => n);

    expect(k.get()).to.eql([1, 2, 3, 4, 5]);
    subscribe(() => {})(k);
    s.set([5, 4, 3, 2, 1]);
    subscribe(v => {
      expect(v).to.eql([5, 4, 3, 2, 1]);
      done();
    })(k);
  });

  it('should track the most recent value if proxy-state is root and subscribed to.', () => {
    const s = state([1, 2, 3, 4]);
    const k = keyed(s, n => n);
    s.set([4, 3, 2, 1]);
    k.get().should.eql([1, 2, 3, 4]); // --> not subscribed
    subscribe(() => {})(k);
    s.set([4, 1, 2, 3]);
    k.get().should.eql([4, 1, 2, 3]);
  });

  it('should emit its proxy-state\'s values when root state.', () => {
    const r: number[][] = [];
    const s = state([1, 2, 3, 4]);
    const k = keyed(s, n => n);
    pipe(k, subscribe(v => r.push(v)));

    s.set([4, 3, 2, 1]);
    k.set([1, 4, 2, 3]);
    r.should.eql([[1, 2, 3, 4], [4, 3, 2, 1], [1, 4, 2, 3]]);
  });

  it('should cause proxy-state to emit values when root state.', () => {
    const r: number[][] = [];
    const s = state([1, 2, 3, 4]);
    const k = keyed(s, n => n);
    pipe(s, subscribe(v => r.push(v)));

    s.set([4, 3, 2, 1]);
    k.set([1, 4, 2, 3]);
    r.should.eql([[1, 2, 3, 4], [4, 3, 2, 1], [1, 4, 2, 3]]);
  });

  it('should emit values to proxy-state\'s upstream.', done => {
    const s = makeState([1, 2, 3, 4], makeSubject(), (t: any, v: any) => {
      if (t === 1) {
        expect(v.value).to.eql([4, 3, 2, 1]);
        expect(v.trace).to.eql({
          from: [1, 2, 3, 4],
          to: [4, 3, 2, 1]
        });
        done();
      }
    });
    const k = keyed(s, n => n);
    k.set([4, 3, 2, 1]);
  });

  it('should pass up errors to the proxied state.', done => {
    const err = {};
    const s = state([1, 2, 3, 4, 5]);
    const k = keyed(s, n => n);
    subscribe({
      error: e => {
        e.should.equal(err);
        done();
      },
    })(s);

    k(2, err);
  });

  it('should terminate when no sinks remain.', done => {
    const s = makeState([], (t: any, d: any) => {
      if (t === 0) {
        d(0, (_t: any) => {
          if (_t === 2) { done(); }
        });
      }
    }, () => {});

    const k = keyed(s, x => x);
    const s1 = subscribe(() => {})(k);
    const s2 = subscribe(() => {})(k);
    s1(); s2();
  });

  it('should re-connect and re-terminate when sinks come and go.', () => {
    let cc = 0; let tc = 0;
    const s = makeState([], (t: any, d: any) => {
      if (t === 0) {
        cc++;
        d(0, (_t: any) => {
          if (_t === 2) { tc++; }
        });
      }
    }, () => {});

    const k = keyed(s, x => x);
    const s1 = subscribe(() => {})(k);
    const s2 = subscribe(() => {})(k);
    cc.should.equal(1); tc.should.equal(0);
    s1(); s2();
    cc.should.equal(1); tc.should.equal(1);
    const s3 = subscribe(() => {})(k);
    cc.should.equal(2); tc.should.equal(1);
    s3();
    cc.should.equal(2); tc.should.equal(2);
  });

  describe('.key()', () => {
    it('should track objects based on provided key function instead of indexes.', () => {
      const r: string[] = [];

      const s = state([{id: 101, name: 'John'}, {id: 102, name: 'Jill'}]);
      const k = keyed(s, p => p.id);

      pipe(k.key(102).sub('name'), subscribe(n => r.push(n!!)));

      r.length.should.equal(1);
      s.set([s.get()[1], s.get()[0]]);
      r.length.should.equal(1);
      s.sub(0).sub('name').set('Judy');
      r.length.should.equal(2);
      r.should.eql(['Jill', 'Judy']);
    });

    it('should properly track batch changes of array.', () => {
      const r: any[] = [];
      const r2: any[] = [];

      const s = state({
        people: [{id: 101, name: 'John'}, {id: 102, name: 'Jill'}]
      });
      const k = keyed(s.sub('people'), p => p.id);

      pipe(k.key(101), subscribe(v => r.push(v)));
      pipe(k.key(102), subscribe(v => r2.push(v)));


      s.set({
        people: [{id: 102, name: 'Judy'}, {id: 101, name: 'John'}]
      });

      k.set([{id: 101, name: 'Jack'}]);
      s.sub('people').set([{id: 103, name: 'Jin'}, {id: 101, name: 'Jack'}]);

      r.should.eql([
        {id: 101, name: 'John'},
        {id: 101, name: 'Jack'}
      ]);
      r2.should.eql([
        {id: 102, name: 'Jill'},
        {id: 102, name: 'Judy'},
        undefined
      ]);
    });

    it('should return proper initial value for undefined keys.', () => {
      const r: any[] = [];
      const s = state([43]);
      const k = keyed(s, n => n);
      subscribe(i => r.push(i))(k.key(42));
      k.set([43, 45]);
      k.set([43, 42]);
      r.should.eql([undefined, 42]);
    });

    it('should return proper initial value for removed keys.', done => {
      const s = state([43, 42]);
      const k = keyed(s, n => n); subscribe(() => {})(k);
      k.set([43]);
      subscribe(v => {
        expect(v).to.be.undefined;
        done();
      })(k.key(42));
    });

    it('should route all changes related to specified key to the state.', () => {
      const r: string[] = [];
      const s = state<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = keyed(s, n => n[0]);

      pipe(k.key(2).sub(1), subscribe(c => r.push(c!!)));
      k.key(2).set([2, 'X']);
      k.set([[2, 'Z'], [3, 'D']]);

      r.should.eql(['B', 'X', 'Z']);
    });

    it('should route changes to a key to proper subs on unkeyed proxies.', () => {
      const r: string[] = [];
      const s = state<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = keyed(s, n => n[0]);

      pipe(s.sub(1).sub(1), subscribe(c => r.push(c!!)));
      k.key(2).sub(1).set('X');
      k.key(2).set([2, 'H']);

      r.should.eql(['B', 'X', 'H']);
    });

    it('should properly route changes from unkeyed proxies.', () => {
      const r: string[] = [];
      const s = state<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = keyed(s, n => n[0]);

      pipe(k.key(2).sub(1), subscribe(c => r.push(c!!)));
      s.sub(1).set([2, 'X']);
      s.set([[2, 'X'], [3, 'Y']]);
      s.sub(0).sub(1).set('W');

      r.should.eql(['B', 'X', 'W']);
    });

    it('should also keep changes in sync between different keyed states.', () => {
      const r: string[] = [];
      const s = state<[number, string][]>([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']]);
      const k = keyed(s, n => n[0]);
      const k2 = keyed(s, n => n[0]);

      pipe(k.key(2).sub(1), subscribe(c => r.push(c!!)));
      k2.key(2).set([2, 'X']);
      k2.key(2).sub(1).set('Z');
      k2.set([[2, 'W']]);

      r.should.eql(['B', 'X', 'Z', 'W']);
    });

    it('should have correct initial value.', () => {
      const s = state([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = keyed(s, p => p.id);

      k.key(102).get()!!.should.eql({id: 102, name: 'Jafar'});
      s.sub(1).sub('name').set('Jafet');
      k.key(102).get()!!.should.eql({id: 102, name: 'Jafet'});
    });

    it('should emit initial value.', done => {
      const s = state([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = keyed(s, p => p.id);
      subscribe(v => {
        expect(v).to.equal('Jafar');
        done();
      })(k.key(102).sub('name'));
    });

    it('should emit correct initial value.', done => {
      const s = state([{id: 101, name: 'Judy'}, {id: 102, name: 'Jafar'}]);
      const k = keyed(s, p => p.id);
      s.sub(1).sub('name').set('Jafet');
      subscribe(v => {
        expect(v).to.equal('Jafet');
        done();
      })(k.key(102).sub('name'));
    });

    it('should emit undefined for undefined initial value on parent state.', done => {
      const s = state(undefined);
      const k = keyed(s as any, x => (x as any).id);
      subscribe(v => {
        expect(v).to.be.undefined;
        done();
      })(k.key(1));
    });

    it('should pass up errors.', done => {
      const err = {};
      const k = keyed(state([1]), n => n);
      subscribe({
        error: e => {
          e.should.equal(err);
          done();
        }
      })(k);
      k.key(1)(2, err);
    });
  });

  describe('.index()', () => {
    it('should track index of a particular key.', () => {
      const r: number[] = [];
      const s = state([42, 43]);
      const k = keyed(s, n => n);
      pipe(k.index(42), subscribe(i => r.push(i)));
      s.set([43, 42]);
      r.should.eql([0, 1]);
    });

    it('should return undefined when a key is removed.', () => {
      const r: any[] = [];
      const s = state([42, 43]);
      const k = keyed(s, n => n);
      pipe(k.index(42), subscribe(i => r.push(i)));
      s.set([43]);
      r.should.eql([0, undefined]);
    });

    it('should return undefined when a key is not yet defined.', () => {
      const r: any[] = [];
      const s = state([43]);
      const k = keyed(s, n => n);
      subscribe(i => r.push(i))(k.index(42));
      s.set([43, 42]);
      r.should.eql([undefined, 1]);
    });

    it('should emit when index has changed.', () => {
      const r: any[] = [];
      const s = state([42, 43, 44, 45]);
      const k = keyed(s, n => n);
      subscribe(i => r.push(i))(k.index(42));
      s.set([42, 43, 44]);
      s.set([43, 44, 42]);
      s.set([44, 43, 42]);
      r.should.eql([0, 2]);
    });

    it('should be terminated when source clears out.', done => {
      const s = state([]);
      const k = keyed(s, x => x);
      subscribe({
        complete: () => done()
      })(k.index(42));

      s.clear();
    });
  });

  describe('.changes()', () => {
    it('should return the changes to the array in terms of additions / deletions and moved items.', () => {
      const r: ListChanges<number>[] = [];
      const s = state([1, 2, 3]);
      const k = keyed(s, n => n);
      pipe(k.changes(), subscribe(c => r.push(c)));
      s.set([1, 3, 2]);
      s.set([1, 3, 2, 4]);
      s.set([1, 5, 3, 2, 4]);
      s.set([5, 3, 2, 4]);

      r.should.eql([
        {
          additions: [],
          deletions: [],
          moves: [
            { oldIndex: 1, newIndex: 2, item: 2 },
            { oldIndex: 2, newIndex: 1, item: 3 }
          ]
        },
        { additions: [ { index: 3, item: 4 } ], deletions: [], moves: [] },
        {
          additions: [ { index: 1, item: 5 } ],
          deletions: [],
          moves: [
            { oldIndex: 2, newIndex: 3, item: 2 },
            { oldIndex: 1, newIndex: 2, item: 3 },
            { oldIndex: 3, newIndex: 4, item: 4 }
          ]
        },
        {
          additions: [],
          deletions: [ { index: 0, item: 1 } ],
          moves: [
            { oldIndex: 3, newIndex: 2, item: 2 },
            { oldIndex: 2, newIndex: 1, item: 3 },
            { oldIndex: 4, newIndex: 3, item: 4 },
            { oldIndex: 1, newIndex: 0, item: 5 }
          ]
        }
      ]);
    });
  });
});
