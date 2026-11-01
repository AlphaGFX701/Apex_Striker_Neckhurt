import {expect,it} from 'vitest';
import {EntryIntent} from './launcher';
it('queues an early Start exactly once and never enters without a tap',()=>{
  const a=new EntryIntent();expect(a.ready()).toBe(false);expect(a.request()).toBe(true);expect(a.request()).toBe(false);
  const b=new EntryIntent();expect(b.request()).toBe(false);expect(b.request()).toBe(false);expect(b.ready()).toBe(true);expect(b.ready()).toBe(false);expect(b.request()).toBe(false);
});
it('allows Start again only after returning to Start',()=>{
  const a=new EntryIntent();a.ready();expect(a.request()).toBe(true);a.reset();expect(a.request()).toBe(true);expect(a.request()).toBe(false);
});
