import {expect,it,vi} from 'vitest';
import {AppSession} from './app-session';
it('deduplicates browser/native interruptions and requires all adapters to return',()=>{
  const ports={running:()=>true,inBattle:()=>true,pause:vi.fn(),clearInput:vi.fn(),stopAudio:vi.fn(),resumeMenu:vi.fn(),back:vi.fn()};
  const s=new AppSession(ports);
  s.setActive('browser',false);s.setActive('native',false);s.setActive('browser',false);
  expect(ports.pause).toHaveBeenCalledTimes(1);expect(ports.stopAudio).toHaveBeenCalledTimes(1);
  s.setActive('browser',true);expect(s.active).toBe(false);
  s.setActive('native',true);expect(s.active).toBe(true);expect(ports.resumeMenu).not.toHaveBeenCalled();
});
it('restores menu audio but never automatically resumes flight, and exposes safe Back',()=>{
  const ports={running:()=>false,inBattle:()=>false,pause:vi.fn(),clearInput:vi.fn(),stopAudio:vi.fn(),resumeMenu:vi.fn(),back:vi.fn()};
  const s=new AppSession(ports);s.setActive('native',false);s.back();expect(ports.back).not.toHaveBeenCalled();
  s.setActive('native',true);expect(ports.resumeMenu).toHaveBeenCalledTimes(1);s.back();expect(ports.back).toHaveBeenCalledTimes(1);
});
it('handles motion loss without changing app activity or leaving held inputs',()=>{
  const ports={running:()=>true,inBattle:()=>true,pause:vi.fn(),clearInput:vi.fn(),stopAudio:vi.fn(),resumeMenu:vi.fn(),back:vi.fn()};
  const s=new AppSession(ports);s.interrupt('Motion lost');expect(s.active).toBe(true);
  expect(ports.pause).toHaveBeenCalledWith('Motion lost');expect(ports.clearInput).toHaveBeenCalledTimes(1);
});
