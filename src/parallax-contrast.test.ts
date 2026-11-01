import {expect,it,vi} from 'vitest';
import type Phaser from 'phaser';
vi.mock('phaser',()=>({default:{Display:{Color:{
  IntegerToColor:(v:number)=>({r:v>>16&255,g:v>>8&255,b:v&255}),
  GetColor:(r:number,g:number,b:number)=>(r<<16)|(g<<8)|b,
  Interpolate:{ColorWithColor:(a:{r:number;g:number;b:number},b:{r:number;g:number;b:number},_length:number,t:number)=>({r:Math.round(a.r+(b.r-a.r)*t),g:Math.round(a.g+(b.g-a.g)*t),b:Math.round(a.b+(b.b-a.b)*t)})},
}}}}));
import {ParallaxEnvironment} from './parallax';
import {GameModel,WORLD} from './model';

function scenePort(){
  const graphics:ReturnType<typeof graphic>[]=[];
  function image(){const item={width:512,height:1024,setDepth:()=>item,setAlpha:()=>item,setDisplaySize:()=>item,setTexture:()=>item,setPosition:()=>item,setScale:()=>item,setVisible:()=>item,setY:()=>item,setRotation:()=>item};return item;}
  function graphic(){const item={rectangles:[] as number[][],clear(){item.rectangles=[];return item;},setDepth:()=>item,fillStyle:()=>item,lineStyle:()=>item,fillCircle:()=>item,strokeCircle:()=>item,strokeEllipse:()=>item,fillEllipse:()=>item,fillRect:(...rect:number[])=>{item.rectangles.push(rect);return item;}};return item;}
  const scene={add:{image,graphics:()=>{const g=graphic();graphics.push(g);return g;}}};
  return{scene:scene as unknown as Phaser.Scene,mist:()=>graphics[1]};
}
it('keeps rectangular atmosphere full-field without an interior dark panel, in every stage/theme/effects mode',()=>{
  for(const stage of [0,1,2])for(const reduced of [false,true]){
    const port=scenePort(),env=new ParallaxEnvironment(port.scene),m=new GameModel();
    for(const [segment,time]of [[0,0],[1,30],[2,90],[3,120],[3,122],[0,0]]){
      m.state.segment=segment;m.state.time=time;env.update(m.state,reduced,stage);
      expect(port.mist().rectangles.length).toBeGreaterThan(0);
      for(const rect of port.mist().rectangles)expect(rect).toEqual([0,0,WORLD.width,WORLD.height]);
    }
  }
});
