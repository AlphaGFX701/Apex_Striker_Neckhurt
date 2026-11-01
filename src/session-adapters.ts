import {Capacitor} from '@capacitor/core';
import type {AppSession} from './app-session';
export async function installSessionAdapters(session:AppSession){
  document.addEventListener('visibilitychange',()=>session.setActive('browser',!document.hidden));
  window.addEventListener('blur',()=>session.setActive('browser',false));
  window.addEventListener('focus',()=>session.setActive('browser',!document.hidden));
  session.setActive('browser',!document.hidden);
  if(Capacitor.isNativePlatform()){
    session.setActive('native',false);
    const {App}=await import('@capacitor/app');
    let revision=0;
    await App.addListener('appStateChange',s=>{revision++;session.setActive('native',s.isActive);});
    await App.addListener('backButton',()=>session.back());
    const queriedAt=revision;
    const state=await App.getState();
    if(revision===queriedAt)session.setActive('native',state.isActive);
  }
}
export async function exitNativeApp(){
  if(Capacitor.isNativePlatform()){const {App}=await import('@capacitor/app');await App.exitApp();}
}
