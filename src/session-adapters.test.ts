import {afterEach,expect,it,vi} from 'vitest';
import {AppSession} from './app-session';
import {installSessionAdapters} from './session-adapters';
const native=vi.hoisted(()=>({listeners:new Map<string,(s:{isActive:boolean})=>void>(),getState:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true}}));
vi.mock('@capacitor/app',()=>({App:{addListener:async(name:string,fn:(s:{isActive:boolean})=>void)=>{native.listeners.set(name,fn);},getState:native.getState}}));
afterEach(()=>{vi.unstubAllGlobals();native.listeners.clear();vi.clearAllMocks();});
function setup(hidden:boolean){
  const document=Object.assign(new EventTarget(),{hidden}),window=new EventTarget();
  vi.stubGlobal('document',document);vi.stubGlobal('window',window);
  const port={running:()=>false,inBattle:()=>false,pause:vi.fn(),clearInput:vi.fn(),stopAudio:vi.fn(),resumeMenu:vi.fn(),back:vi.fn()};
  return{session:new AppSession(port),port,document};
}
it('seeds hidden browser and native state before allowing menu audio',async()=>{
  const {session,port,document}=setup(true);native.getState.mockResolvedValue({isActive:true});
  await installSessionAdapters(session);expect(session.active).toBe(false);expect(port.stopAudio).toHaveBeenCalled();expect(port.resumeMenu).not.toHaveBeenCalled();
  document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));
  expect(session.active).toBe(true);expect(port.resumeMenu).toHaveBeenCalledTimes(1);
});
it('ignores a stale initial native query after a newer native notification',async()=>{
  const {session}=setup(false);let resolve!:(s:{isActive:boolean})=>void;
  native.getState.mockImplementation(()=>new Promise(r=>{resolve=r;}));
  const installed=installSessionAdapters(session);
  await vi.waitFor(()=>expect(native.getState).toHaveBeenCalled());
  native.listeners.get('appStateChange')!({isActive:true});resolve({isActive:false});await installed;
  expect(session.active).toBe(true);native.listeners.get('appStateChange')!({isActive:false});expect(session.active).toBe(false);
});
