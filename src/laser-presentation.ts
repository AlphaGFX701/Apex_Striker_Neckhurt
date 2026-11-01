export const LASER_WARNING_SECONDS = 1.2;
export const LASER_DAMAGE_WIDTH = 44;
export interface PresentedBeam { id?: number; x: number; age: number; y?: number; sweep?: boolean }
export interface LaserCue { id: number; kind: 'charge' | 'fire' | 'stop'; sweep: boolean }

/** Model-owned presentation clock. Re-reading a paused snapshot never repeats a cue. */
export class LaserTimeline {
  private serial = 0;
  private active = new Map<number, { fired: boolean; sweep: boolean }>();
  sync(beams: PresentedBeam[]): LaserCue[] {
    const cues: LaserCue[] = [], present = new Set<number>();
    for (const beam of beams) {
      if(beam.id != null) this.serial=Math.max(this.serial,beam.id);
      beam.id ??= ++this.serial;
      present.add(beam.id);
      let previous = this.active.get(beam.id);
      if (!previous) {
        previous = { fired: false, sweep: !!beam.sweep };
        this.active.set(beam.id, previous);
        if (beam.age < LASER_WARNING_SECONDS) cues.push({ id: beam.id, kind: 'charge', sweep: !!beam.sweep });
      }
      if (!previous.fired && beam.age >= LASER_WARNING_SECONDS) {
        previous.fired = true;
        cues.push({ id: beam.id, kind: 'fire', sweep: !!beam.sweep });
      }
    }
    for (const [id, entry] of this.active) if (!present.has(id)) {
      cues.push({ id, kind: 'stop', sweep: entry.sweep }); this.active.delete(id);
    }
    return cues;
  }
}
