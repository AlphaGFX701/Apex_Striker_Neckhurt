import Phaser from 'phaser';
import { beamGeometry } from './neon';
import { LASER_DAMAGE_WIDTH, LASER_WARNING_SECONDS, type PresentedBeam } from './laser-presentation';

type BeamVisual = {
  zone: Phaser.GameObjects.TileSprite; energy: Phaser.GameObjects.TileSprite;
  core: Phaser.GameObjects.TileSprite; halo: Phaser.GameObjects.TileSprite;
  head: Phaser.GameObjects.Image; tail: Phaser.GameObjects.Image; alert: Phaser.GameObjects.Image;
};

/** Fixed pool: geometry comes from the same helper as collision, never from the art. */
export class LaserVisuals {
  private pool: BeamVisual[] = [];
  private marks: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) { this.marks = scene.add.graphics().setDepth(2.6); }
  private create(): BeamVisual {
    const tile = (key: string) => this.scene.add.tileSprite(0,0,44,32,key).setDepth(2.2);
    const image = (key: string) => this.scene.add.image(0,0,key).setDepth(2.4);
    return {zone:tile('tactical-danger-tile'),energy:tile('tactical-beam-energy'),core:tile('tactical-beam-core'),halo:tile('tactical-beam-halo'),
      head:image('tactical-beam-head'),tail:image('tactical-beam-tail'),alert:image('tactical-danger-alert')};
  }
  draw(beams: PresentedBeam[], playerY:number, reduced:boolean, time:number) {
    for(const visual of this.pool) for(const sprite of Object.values(visual)) sprite.setVisible(false);
    const g=this.marks;g.clear();
    for(let i=0;i<Math.min(beams.length,4);i++) {
      const beam=beams[i], line=beamGeometry(beam), dx=line.x2-line.x1,dy=line.y2-line.y1;
      const length=Math.hypot(dx,dy),rotation=Math.atan2(dy,dx)-Math.PI/2;
      const centerX=(line.x1+line.x2)/2,centerY=(line.y1+line.y2)/2;
      const v=this.pool[i]??(this.pool[i]=this.create());
      const place=(sprite:Phaser.GameObjects.TileSprite,width:number,alpha:number)=>{
        sprite.setSize(width,length).setPosition(centerX,centerY).setRotation(rotation).setAlpha(alpha).setVisible(true);
      };
      if(beam.age<LASER_WARNING_SECONDS) {
        place(v.zone,LASER_DAMAGE_WIDTH,reduced?.55:.44+.12*Math.sin(beam.age*10));
        const t=beam.sweep?.18:Math.max(.12,Math.min(.85,(playerY-70-line.y1)/length));
        const x=Phaser.Math.Clamp(line.x1+dx*t,25,365),y=Phaser.Math.Clamp(line.y1+dy*t,55,640);
        v.alert.setPosition(x,y).setDisplaySize(42,42).setAlpha(reduced?1:.78+.22*Math.sin(beam.age*10)).setVisible(true);
        g.lineStyle(2,0xffc56b,.8);g.strokeCircle(line.x1,line.y1,22);
        if(beam.sweep){
          // A small arc at the emitter communicates the coming 180-degree sweep.
          g.beginPath();g.arc(line.x1,line.y1,58,0,Math.PI);g.strokePath();
          g.lineBetween(line.x1+54,line.y1+5,line.x1+61,line.y1+15);
        }
      } else {
        place(v.halo,68,reduced?.12:.22);
        place(v.energy,LASER_DAMAGE_WIDTH,.88);
        place(v.core,18,1);
        const shimmer=reduced?1:1+Math.sin(time*32)*.035;
        v.energy.tileScaleX=shimmer;
        const headRotation=rotation+Math.PI;
        v.head.setPosition(line.x1,line.y1).setRotation(headRotation).setDisplaySize(44,32).setVisible(true);
        v.tail.setPosition(line.x2,line.y2).setRotation(headRotation).setDisplaySize(44,48).setVisible(true);
        if(!reduced) for(let j=0;j<3;j++){
          const angle=time*12+j*2.1;
          g.lineStyle(2,0xffdc9b,.65);g.lineBetween(line.x1+Math.cos(angle)*12,line.y1+Math.sin(angle)*12,line.x1+Math.cos(angle)*26,line.y1+Math.sin(angle)*26);
        }
      }
    }
  }
}
