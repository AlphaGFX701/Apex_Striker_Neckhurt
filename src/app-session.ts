interface SessionPort {
  running():boolean; inBattle():boolean;
  pause(reason:string):void; clearInput():void;
  stopAudio():void; resumeMenu():void; back():void;
}
/** Browser and native lifecycle events share one idempotent flight policy. */
export class AppSession {
  private activity={browser:true,native:true};
  get active(){return this.activity.browser && this.activity.native;}
  constructor(private port:SessionPort){}
  setActive(adapter:keyof AppSession['activity'],active:boolean){
    const wasActive=this.active;this.activity[adapter]=active;
    if(wasActive===this.active)return;
    if(!this.active)this.interrupt('App paused.');
    else {this.port.clearInput();if(!this.port.inBattle())this.port.resumeMenu();}
  }
  interrupt(reason:string){
    if(this.port.running())this.port.pause(reason);
    this.port.clearInput();this.port.stopAudio();
  }
  back(){if(this.active)this.port.back();}
}
