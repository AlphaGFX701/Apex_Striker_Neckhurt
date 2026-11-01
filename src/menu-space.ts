/** One lightweight background shared by Start and every DOM menu. No Phaser dependency. */
export class MenuSpace {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;
  private width = 0;
  private height = 0;
  private elapsed = 0;
  private previous = 0;
  private painted = 0;
  private pending = 0;
  private skies = [0,1,2].map(i => this.image(`/assets/environment/feony-scroll-${i}.webp`));
  private planets = [0,1,2].map(i => this.image(`/assets/neon/planet-${i}-0.png`));
  private stars = Array.from({length:56},(_,i)=>({x:((i*137+29)%997)/997,y:((i*211+53)%991)/991,z:1+i%3,phase:i*1.7}));
  private image(url: string) { const image = new Image(); image.src = url; return image; }
  constructor() {
    this.canvas.id = 'menu-space'; this.canvas.setAttribute('aria-hidden','true');
    document.body.prepend(this.canvas);
    window.addEventListener('resize',()=>this.resize()); this.resize();
    requestAnimationFrame(this.draw);
  }
  private resize() {
    this.width = innerWidth; this.height = innerHeight;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    this.canvas.width = Math.ceil(this.width*dpr); this.canvas.height = Math.ceil(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  private draw = (now: number) => {
    const dt = Math.min(.05, (now-this.previous)/1000); this.previous = now;
    const visible = !document.hidden && document.body.dataset.view !== 'battle';
    if(!visible) this.pending=0; else this.pending+=dt;
    if(visible && now-this.painted >= 32) {
      const reduced = document.body.classList.contains('reduced-effects') || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduced) this.elapsed += this.pending;
      this.pending=0;
      this.painted = now;
      const ctx=this.ctx,w=this.width,h=this.height,time=this.elapsed;
      const stage=Math.max(0,Math.min(2,Number(document.body.dataset.sector)||0)),sky=this.skies[stage];
      ctx.globalAlpha=1;ctx.fillStyle='#090d12';ctx.fillRect(0,0,w,h);
      if(sky.complete && sky.naturalWidth) {
        const scale=Math.max(w/sky.width,(h+40)/sky.height),height=sky.height*scale;
        const offset=(time*3)%height;
        ctx.globalAlpha=.36;
        for(let i=-1;i<2;i++) ctx.drawImage(sky,(w-sky.width*scale)/2,offset+i*height,sky.width*scale,height+1);
      }
      const planet=this.planets[stage],size=Math.max(180,Math.min(430,w*.6));
      if(planet.complete && planet.naturalWidth){ctx.globalAlpha=.18;ctx.drawImage(planet,w-size*.58,-size*.1+Math.sin(time*.04)*15,size,size);}
      for(const star of this.stars){
        const y=(star.y*h+time*star.z*4)%(h+20)-10;
        ctx.globalAlpha=(.12+star.z*.055)*(reduced?1:.75+.25*Math.sin(time*.5+star.phase));
        ctx.fillStyle='#d6f4ed';ctx.fillRect(star.x*w,y,star.z===3?1.5:1,star.z===3?1.5:1);
      }
      if(!reduced) for(let i=0;i<6;i++){
        ctx.globalAlpha=.035;ctx.fillStyle='#a7d6d2';
        const x=(i*163+w*.1)%w,y=(i*193+time*11)%(h+50)-25;
        ctx.beginPath();ctx.ellipse(x,y,3+i%3,1.5,i*.5,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    requestAnimationFrame(this.draw);
  };
}

export function installTacticalInteractions() {
  const timers = new WeakMap<HTMLElement, number>();
  const flare = document.createElement('div'); flare.className='menu-pointer-flare'; flare.setAttribute('aria-hidden','true'); document.body.append(flare);
  document.addEventListener('pointermove', e => {
    const menu = document.body.dataset.view !== 'battle';
    const show = menu && e.pointerType === 'mouse' && matchMedia('(hover: hover)').matches;
    flare.classList.toggle('is-visible', show);
    if(show){flare.style.left=`${e.clientX}px`;flare.style.top=`${e.clientY}px`;}
  },{passive:true});
  const release = (target: EventTarget | null, x?: number, y?: number) => {
    const element = target instanceof Element ? target.closest<HTMLElement>('button,input[type="range"]') : null;
    if(!element || element.matches(':disabled'))return;
    const rect=element.getBoundingClientRect();
    element.style.setProperty('--tap-x',`${x==null?rect.width/2:x-rect.left}px`);
    element.style.setProperty('--tap-y',`${y==null?rect.height/2:y-rect.top}px`);
    const cls=element.tagName==='INPUT'?'is-adjusting':'is-releasing';
    element.classList.remove(cls); void element.offsetWidth; element.classList.add(cls);
    clearTimeout(timers.get(element));timers.set(element,window.setTimeout(()=>element.classList.remove(cls),280));
  };
  document.addEventListener('pointerup',e=>release(e.target,e.clientX,e.clientY));
  document.addEventListener('click',e=>{if(e.detail===0)release(e.target);});
  document.addEventListener('input',e=>release(e.target));
}
