import { getStageBalance, standardImpact, GAME_BALANCE_CONFIG, type WaveBalance, type EnemyBalanceGroup } from "./neon";
import { DIFFICULTY, beamDistance, ORB_SUPPLY_TIMES, superMultiplier, endingDuration, nextEscapeLane, type EnemyArchetype, type BossPattern, type HazardState, type SuperModeState, type EndingSequence } from "./neon";
import {
  StageWaveManager,
  waveAt,
  FORMATIONS,
  formationSpecs,
  seededRandom,
  flightPathPosition,
  type FlightPath,
  type SpawnSpec,
  type Formation,
} from "./stage-waves";
import { BOSS_ART } from "./onslaught-assets";
import {
  ProjectileGrid,
  sweptContact,
  threatensPassage,
} from "./projectile-combat";
import type { Axes } from "./sensor";
import type { Action } from "./motion";
import {
  defaultRun,
  STAGES,
  weaponVolley,
  damageMultiplier,
  type RunConfig,
  type DamageType,
} from "./equipment";
export const WORLD = { width: 390, height: 693.3333333333, margin: 23 };
export const LIMITS = {
  enemies: 22,
  playerBullets: 480,
  enemyBullets: 480,
  pickups: 60,
  particles: 160,
};
export interface Body {
  x: number;
  y: number;
  radius: number;
}
export interface Rock extends Body {
  iron?: boolean; fragment?: boolean; vx?: number;
  speed: number;
  spin: number;
  phase: number;
  target: boolean;
}
export interface Bullet extends Body {
  prevX?: number;
  prevY?: number;
  interceptor?: boolean;
  speed: number;
  vx?: number;
  damage?: number;
  type?: DamageType;
  missile?: boolean;
  age?: number;
}
export interface Enemy extends Body {
  balance?: WaveBalance; balanceGroup?: EnemyBalanceGroup; visibleTime?: number; hasFired?: boolean;
  muzzle?: number; archetype?: EnemyArchetype; shieldHP?: number; lock?: { x: number; y: number };
  path?: FlightPath;
  health: number;
  shot: number;
  phase: number;
  kind?: number;
  flash?: number;
  flashAt?: number;
  stun?: number;
  motion?: Formation;
  originX?: number;
  age?: number;
  leader?: boolean;
  faction?: number;
}
export type PickupKind =
  | "weapon"
  | "missile"
  | "drone"
  | "shield"
  | "repair"
  | "energy";
export interface EnemyBullet extends Body {
  homing?: boolean; age?: number; lane?: number; source?: "boss" | "escort";
  prevX?: number;
  prevY?: number;
  vx: number;
  vy: number;
}
export interface Turret {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  flash: number;
  flashAt?: number;
}
export interface Boss extends Body {
  muzzle?: number; rage?: boolean; pattern?: BossPattern; decoyCooldown?: number; decoys?: { x: number; y: number }[];
  dash?: { age: number; x: number; y: number };
  state?: "armored" | "exposed" | "transition" | "defeated";
  transitionRemaining?: number;
  safeLaneX?: number;
  attackSerial?: number;
  restUntil?: number;
  health: number;
  maxHealth: number;
  shot: number;
  phase?: number;
  turrets?: Turret[];
  flash?: number;
  flashAt?: number;
  age?: number;
}
export interface Drone {
  id: number;
  side: -1 | 1;
  rank: number;
}
export interface EvolutionState {
  orbs: number;
  level: 1 | 2 | 3;
  transformRemaining: number;
}
export interface WingmanState {
  level: 0 | 1 | 2 | 3;
}
export interface RunStats {
  enemiesDestroyed: number;
  bestMultiplier: number;
}
export const comboMultiplier = (chain: number) =>
  chain >= 20 ? 5 : chain >= 10 ? 3 : chain >= 5 ? 2 : 1;
export interface PickupCollected {
  kind: PickupKind;
  effect: PickupKind | "score" | "super";
}
export type CombatEvent =
  | { id: number; type: "pickup"; data: PickupCollected }
  | {
      id: number;
      type:
        | "warning"
        | "mini-destroyed"
        | "enemy-destroyed"
        | "phase"
        | "shield-hit"
        | "drone-intercept"
        | "hull-hit"
        | "emp"
        | "boss-destroyed";
      text: string;
    };
export interface GameSnapshot {
  superMode: SuperModeState; hazards: HazardState[]; ending: EndingSequence | null; weaponJammed: boolean;
  evolution: EvolutionState;
  wingmen: WingmanState;
  stats: RunStats;
  velocity: Axes;
  ship: Body;
  rocks: Rock[];
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  boss: Boss | null;
  miniBoss: Boss | null;
  segment: number;
  warning: string;
  warningUntil: number;
  storm: { x: number; width: number; age: number } | null;
  meteors: { safeX: number; age: number; spawned: boolean } | null;
  score: number;
  lives: number;
  time: number;
  bossStarted: number;
  gameOver: boolean;
  invincible: number;
  outcome: "won" | "lost" | "withdrawn" | "timeout" | null;
  result: "won" | "lost" | "timeout" | "practice" | "withdrawn" | null;
  energy: number;
  dodgeCooldown: number;
  dodgeTime: number;
  dodgeDirection: number;
  warpOrigin: { x: number; y: number };
  dodges: number;
  emps: number;
  empEffect: number;
  empOrigin: { x: number; y: number };
  hitEffect: number;
  damageKind: "hull" | "shield" | "drone";
  credits: number;
  combo: number;
  shield: boolean;
  shieldTimer: number;
  wave: number;
  powerChoices: string[];
  perks: Record<string, number>;
  pickups: {
    x: number;
    y: number;
    value: number;
    age: number;
    kind?: PickupKind;
  }[];
  powers: { weapon: number; missile: number; drone: number; overdrive: number };
  pickupCount: number;
  intercepted: number;
  explosions: {
    x: number;
    y: number;
    age: number;
    art?: string;
    size?: number;
    spark?: boolean;
  }[];
  beams: { x: number; age: number; y?: number; sweep?: boolean }[];
  drones: Drone[];
  interceptions: {
    fromX: number;
    fromY: number;
    x: number;
    y: number;
    age: number;
  }[];
  laser: number;
  laserInterceptor: boolean;
  seed: number;
  formation: string;
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const collides = (a: Body, b: Body) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.radius + b.radius) ** 2;
export function clampShip(x: number, y: number) {
  return {
    x: clamp(x, WORLD.margin, WORLD.width - WORLD.margin),
    y: clamp(y, 100, WORLD.height - 35),
  };
}
export function dronePosition(ship: Body, d: Drone) {
  const desiredX = ship.x + d.side * (84 + d.rank * 23);
  const x = clamp(desiredX, 18, WORLD.width - 18);
  // Near a screen edge, move the obstructed wingman forward instead of
  // clamping it on top of the flagship's wide evolved wings.
  const obstructed = Math.abs(x - ship.x) < 80;
  return {
    x,
    y: obstructed ? Math.max(22, ship.y - 70) : ship.y + 8 + d.rank * 23,
  };
}
/** Stage-one guided weapons share the same visible hardpoint geometry as collisions. */
export function bossAimPoints(b: Boss): Body[] {
  if (b.state === "transition" || b.state === "defeated") return [];
  if (b.state === "armored")
    return (b.turrets ?? [])
      .filter((t) => t.health > 0)
      .map((t) => ({ x: b.x + t.x, y: b.y + t.y, radius: 18 }));
  return [{ x: b.x, y: b.y, radius: b.radius }];
}
/** One geometry owner for projectile admission, beam selection and damage routing. */
export function findBossHit(
  b: Boss,
  x: number,
  y: number,
  radius = 0,
  ray = false,
): Turret | "core" | null {
  const turrets = (b.turrets ?? [])
    .filter((t) => t.health > 0)
    .sort((a, c) => c.y - a.y);
  for (const t of turrets) {
    const dx = x - (b.x + t.x),
      dy = y - (b.y + t.y),
      r = 18 + radius;
    if (ray ? Math.abs(dx) < r && b.y + t.y - r < y : dx * dx + dy * dy < r * r)
      return t;
  }
  const dx = x - b.x,
    dy = y - b.y,
    r = b.radius + radius;
  return (ray ? Math.abs(dx) < r && b.y - r < y : dx * dx + dy * dy < r * r)
    ? "core"
    : null;
}
export class GameModel {
  fireCount = 0;
  state: GameSnapshot;
  practice = false;
  weapon: "straight" | "spread" = "straight";
  config: RunConfig = defaultRun();
  private spawnClock = 0;
  private enemyClock = 0;
  private shotClock = 0;
  private actionLock = 0;
  private missileClock = 0;
  private droneClock = 0;
  private beamClock = 3;
  private laserBlockBudget = 0;
  private waveAt = 30;
  private bossAt = 90;
  private cycleStart = 0;
  private velocity: Axes = { x: 0, y: 0 };
  private killsSinceDrop = 0;
  private supplyIndex = 0;
  private director = new StageWaveManager();
  private eventId = 0;
  private events: CombatEvent[] = [];
  private droneId = 0;
  private droneCollected = false;
  private lastFormation = "";
  private emittingBoss = false;
  private stationary = 0;
  private anchor = { x: 195, y: 610 };
  private random: () => number;
  private sourceRandom: () => number;
  constructor(random = Math.random) {
    this.sourceRandom = random;
    this.random = random;
    this.state = this.initialState();
  }
  private initialState(): GameSnapshot {
    return {
      superMode: { remaining: 0 }, hazards: [], ending: null, weaponJammed: false,
      evolution: { orbs: 0, level: 1, transformRemaining: 0 },
      wingmen: { level: 0 },
      stats: { enemiesDestroyed: 0, bestMultiplier: 1 },
      velocity: { x: 0, y: 0 },
      ship: { x: 195, y: 610, radius: 6 },
      rocks: [],
      bullets: [],
      enemies: [],
      enemyBullets: [],
      boss: null,
      miniBoss: null,
      segment: 0,
      warning: "",
      warningUntil: 0,
      storm: null,
      meteors: null,
      score: 0,
      lives: 3,
      time: 0,
      bossStarted: 0,
      gameOver: false,
      invincible: 0,
      result: null,
      outcome: null,
      energy: 0,
      dodgeCooldown: 0,
      dodgeTime: 0,
      dodgeDirection: 0,
      warpOrigin: { x: 195, y: 610 },
      dodges: 0,
      emps: 0,
      empEffect: 0,
      empOrigin: { x: 195, y: 610 },
      hitEffect: 0,
      damageKind: "hull",
      credits: 0,
      combo: 0,
      shield: false,
      shieldTimer: 0,
      wave: 1,
      powerChoices: [],
      perks: {},
      pickups: [],
      powers: { weapon: 0, missile: 0, drone: 0, overdrive: 0 },
      pickupCount: 0,
      intercepted: 0,
      explosions: [],
      beams: [],
      drones: [],
      interceptions: [],
      laser: 0,
      laserInterceptor: false,
      seed: 0,
      formation: "",
    };
  }
  configure(config: RunConfig) {
    this.config = structuredClone(config);
    this.weapon = config.equipment.main === "plasma" ? "spread" : "straight";
  }
  reset() {
    this.fireCount = 0;
    this.supplyIndex = 0;
    this.killsSinceDrop = 0;
    this.director.reset();
    this.cycleStart = 0;
    this.events = [];
    this.eventId = 0;
    this.state = this.initialState();
    this.state.seed =
      (this.config.seed ?? Math.floor(this.sourceRandom() * 0xffffffff)) >>> 0;
    this.random = seededRandom(this.state.seed);
    this.spawnClock =
      this.enemyClock =
      this.shotClock =
      this.actionLock =
      this.missileClock =
      this.droneClock =
        0;
    this.beamClock = 3;
    this.waveAt = 30;
    this.bossAt = 90;
    this.droneId = 0;
    this.droneCollected = false;
    this.lastFormation = "";
    this.clearInput();
  }
  clearInput() {
    this.velocity = { x: 0, y: 0 };
    this.state.velocity = { x: 0, y: 0 };
    this.stationary = 0;
    this.anchor = { x: this.state.ship.x, y: this.state.ship.y };
  }
  drainEvents() {
    return this.events.splice(0);
  }
  private event(type: Exclude<CombatEvent["type"], "pickup">, text = "") {
    this.events.push({ id: ++this.eventId, type, text });
  }
  private notice(text: string, duration = 1.5) {
    this.state.warning = text;
    this.state.warningUntil = this.state.time + duration;
    this.event("warning", text);
  }
  fillEnergy() {
    if (this.practice && !this.state.gameOver) this.state.energy = 100;
  }
  withdraw() {
    this.finish("withdrawn");
  }
  choosePower(_id: string) {
    return false;
  }
  action(action: Action): { accepted: boolean; reason: string } {
    const s = this.state;
    if (s.gameOver)
      return { accepted: false, reason: "Start or resume a mission first." };
    if (this.actionLock > 0)
      return { accepted: false, reason: "Maneuver in progress." };
    if (action === "emp") {
      if (s.energy < 100)
        return { accepted: false, reason: "EMP is charging." };
      s.energy = 0;
      s.emps++;
      s.empEffect = 0.75;
      s.empOrigin = { x: s.ship.x, y: s.ship.y };
      for (const e of s.enemies) this.kill(e);
      s.enemies = [];
      s.enemyBullets = [];
      s.beams = [];
      for (const r of s.rocks) this.explode(r.x, r.y, undefined, 65);
      s.hazards=[];
      s.rocks = [];
      s.meteors = null;
      this.stationary = 0;
      this.anchor = { x: s.ship.x, y: s.ship.y };
      this.beamClock = Math.max(this.beamClock, 1.2);
      if (s.miniBoss) s.miniBoss.shot = Math.max(s.miniBoss.shot, 1.2);
      if (s.boss) {
        s.boss.shot = 1.2;
        s.boss.restUntil = s.time + 1.2;
      }
      this.event("emp");
      this.actionLock = 0.25;
      return { accepted: true, reason: "EMP · arena cleared." };
    }
    if (s.dodgeCooldown > 0)
      return { accepted: false, reason: "Warp drive recharging." };
    s.warpOrigin = { x: s.ship.x, y: s.ship.y };
    s.dodgeCooldown = 2.5;
    s.ship.x = clampShip(
      s.ship.x + (action === "dodgeLeft" ? -130 : 130),
      s.ship.y,
    ).x;
    s.dodgeTime = 0.6;
    s.invincible = Math.max(s.invincible, 0.6);
    s.dodgeDirection = action === "dodgeLeft" ? -1 : 1;
    s.dodges++;
    this.actionLock = 0.2;
    this.clearInput();
    return {
      accepted: true,
      reason: action === "dodgeLeft" ? "Warp left" : "Warp right",
    };
  }
  private finish(result: NonNullable<GameSnapshot["result"]>) {
    this.state.outcome = result === "practice" ? "won" : result;
    this.state.result = this.practice ? "practice" : result;
    this.state.gameOver = true;
    const kind = this.practice ? "practice" : result === "won" ? "victory" : result === "lost" || result === "timeout" ? "defeat" : "withdrawn";
    this.state.ending = { kind, elapsed: 0, duration: endingDuration(kind) };
    this.state.enemyBullets = []; this.state.beams = []; this.state.hazards = [];
    if(kind==='victory') {
      for(const enemy of this.state.enemies) this.explode(enemy.x,enemy.y,`enemy-${enemy.faction??this.config.stage}-${enemy.kind??0}`,65);
      this.state.enemies=[];this.state.rocks=[];this.state.pickups=[];this.state.bullets=[];
    }
    if (kind === "defeat") this.explode(this.state.ship.x, this.state.ship.y, undefined, 130);
    this.clearInput();
  }
  private explode(x: number, y: number, art?: string, size = 65) {
    this.state.explosions.push({ x, y, age: 0, art, size });
  }
  private spark(x: number, y: number) {
    if (this.state.explosions.length < 48)
      this.state.explosions.push({ x, y, age: 0, spark: true, size: 25 });
  }
  private awardDestruction(baseScore: number) {
    const s = this.state;
    s.combo++;
    s.stats.enemiesDestroyed++;
    const multiplier = comboMultiplier(s.combo);
    s.stats.bestMultiplier = Math.max(s.stats.bestMultiplier, multiplier);
    s.score += baseScore * multiplier;
  }
  private kill(e: Enemy) {
    const s = this.state;
    if (e.health === -Infinity) return;
    e.health = -Infinity;
    this.event("enemy-destroyed");
    this.awardDestruction(e.kind === 2 ? (e.balance?.eliteScore ?? 90) : (e.balance?.standardScore ?? 40));
    this.explode(
      e.x,
      e.y,
      `enemy-${e.faction ?? this.config.stage}-${e.kind ?? 0}`,
      e.kind === 2 ? 100 : 70,
    );
    this.killsSinceDrop++;
    if (e.kind === 2 || this.killsSinceDrop >= 5 || this.random() < 0.3) {
      const kinds: PickupKind[] = [
        "weapon",
        "missile",
        "missile",
        "missile",
        "drone",
        "drone",
        "drone",
        "shield",
        "shield",
        "shield",
        "repair",
        "repair",
        "repair",
        "energy",
        "energy",
        "energy",
      ];
      // Preserve the other rewards while halving the chance of a weapon orb.
      kinds.push(...kinds.filter((kind) => kind !== "weapon"));
      if (s.lives === 1) kinds.push("repair", "repair", "repair");
      s.pickups.push({
        x: e.x,
        y: e.y,
        value: 0,
        age: 0,
        kind: kinds[Math.floor(this.random() * kinds.length) % kinds.length],
      });
      this.killsSinceDrop = 0;
    }
    if (e.leader)
      for (const ally of s.enemies)
        if (ally.motion === "vee") {
          ally.shot += 0.8;
          ally.stun = 0.35;
        }
  }
  private damage(kind: "bullet" | "beam" | "collision", impact?: Body) {
    const s = this.state;
    if (s.invincible > 0 || s.gameOver) return;
    s.hitEffect = 0.3;
    if (s.shield) {
      s.shield = false;
      s.shieldTimer = 0;
      s.damageKind = "shield";
      s.invincible = 0.6;
      this.event("shield-hit");
      return;
    }
    s.damageKind = "hull";
    s.invincible = 1.5;
    this.event("hull-hit");
    if (!this.practice) {
      s.combo = 0;
      s.lives--;
      if (s.lives <= 0) this.finish("lost");
    }
  }
  private fan(
    x: number,
    y: number,
    count: number,
    speed: number,
    offset = 0,
    spacing = 0.18,
  ) {
    speed *= Math.min(
      1.4,
      1 + this.config.stage * 0.08 + (this.state.wave - 1) * 0.025,
    );
    for (
      let i = 0;
      i < count && this.state.enemyBullets.length < LIMITS.enemyBullets;
      i++
    ) {
      const a = offset + (i - (count - 1) / 2) * spacing;
      this.pushPatternShot({
        x,
        y,
        radius: 4,
        vx: Math.sin(a) * speed,
        vy: Math.cos(a) * speed,
      });
    }
  }
  private ring(x: number, y: number, speed: number, rotation = 0, count = 24) {
    speed *= Math.min(
      1.4,
      1 + this.config.stage * 0.08 + (this.state.wave - 1) * 0.025,
    );
    const gap = Math.atan2(this.state.ship.y - y, this.state.ship.x - x) + 0.35;
    for (
      let i = 0;
      i < count && this.state.enemyBullets.length < LIMITS.enemyBullets;
      i++
    ) {
      const a = (i * Math.PI * 2) / count + rotation;
      if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.28)
        continue;
      this.pushPatternShot({
        x,
        y,
        radius: 4,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
      });
    }
  }
  private spawnFormation(bossSupport = false) {
    const s = this.state,
      stage = this.config.stage;
    const balance=getStageBalance(stage,s.time,this.config.mode,bossSupport);
    if(balance && !balance.spawnEnabled) return;
    let specs: SpawnSpec[];
    if (stage === 0 && this.config.mode === "stage" && !bossSupport) {
      const squad = this.director.nextSquad(s.time, this.random);
      s.formation = squad.id;
      specs = squad.ships;
    } else {
      let pool: readonly Formation[] =
        s.segment === 0
          ? FORMATIONS.slice(0, 2)
          : s.segment === 1
            ? FORMATIONS.filter((f) => f !== "wall")
            : FORMATIONS;
      if(balance) pool=FORMATIONS.filter(f=>balance.formations.includes(f));
      if (bossSupport) pool = ["vee", "pincer", "escort", "zigzag"];
      const choices = pool.filter((f) => f !== this.lastFormation);
      const f =
        choices[Math.floor(this.random() * choices.length) % choices.length];
      this.lastFormation = f;
      s.formation = f;
      specs = formationSpecs(f, stage, 85 + this.random() * 220, balance?.waveSize);
    }
    for (const e of bossSupport ? specs.slice(0, 2) : specs) {
      if (s.enemies.length >= (bossSupport ? DIFFICULTY[stage].supportCap : balance?.enemyCap ?? DIFFICULTY[stage].enemyCap)) break;
      if (
        e.kind === 2 &&
        s.enemies.filter((other) => other.kind === 2).length >= (balance?.armorCap ?? 2)
      )
        continue;
      if (bossSupport) {
        const leftCount = s.enemies.filter((ally) => (ally.originX ?? ally.x) < 195).length;
        const rightCount = s.enemies.length - leftCount;
        if (leftCount >= DIFFICULTY[stage].supportCap / 2 && rightCount >= DIFFICULTY[stage].supportCap / 2) break;
        e.x = leftCount <= rightCount && leftCount < DIFFICULTY[stage].supportCap / 2 ? 60 : 330;
        e.y = -35;
        e.motion = "escort";
        e.kind = 0;
      }
      if(e.motion==='crossfire' && !bossSupport) {
        e.x=e.x<195?-36:426;e.y=140+(s.enemies.length%3)*45;
        this.notice('CROSSFIRE INBOUND',1.2);
      }
      let archetype:EnemyArchetype=e.kind===2?'shield-wall':s.segment>0 && this.random()<0.18?'kamikaze':e.motion==='crossfire'?'crossfire':e.kind===1?'rear-gunner':'fighter';
      if(balance) {
        if(e.motion==='crossfire') archetype='crossfire';
        if(!balance.archetypes.includes(archetype)) archetype='fighter';
      }
      s.enemies.push({
        ...e,
        radius: e.kind === 2 ? 22 : 16,
        health:
          (e.kind === 2 ? DIFFICULTY[stage].armorHP : balance?.enemyHP ?? DIFFICULTY[stage].enemyHP) *
          Math.min(1.6, 1 + (s.wave - 1) * 0.025),
        shot: balance ? 0 : e.motion === "crossfire" ? 1.2 : 0.6,
        balance:balance??undefined, balanceGroup:bossSupport?"boss-support":e.kind===2?"elite":"standard",
        visibleTime:0, hasFired:false,
        originX: e.x,
        age: 0,
        faction: stage,
        archetype,
        shieldHP: e.kind === 2 ? DIFFICULTY[stage].armorHP * 0.35 : 0,
      });
    }
  }
  private startBoss() {
    const s = this.state,
      stage = this.config.stage,
      art = BOSS_ART[stage];
    const hp = DIFFICULTY[stage].bossHP * Math.min(2.5, 1 + (s.wave - 1) * 0.04);
    s.boss = {
      state: "armored" as const, transitionRemaining: 0,
      safeLaneX: 265,
      attackSerial: 0,
      restUntil: 0,
      x: 195,
      y: 175 + stage * 15,
      radius: art.width * 0.34,
      health: hp,
      maxHealth: hp,
      shot: 0.9,
      phase: 1,
      age: 0,
      turrets: art.mounts.map((m) => ({
        x: m.x * art.width,
        y: m.y * art.width,
        health: 15 + stage * 5,
        maxHealth: 15 + stage * 5,
        flash: 0,
      })),
    };
    s.bossStarted = s.time;
    s.rocks = [];
    s.enemies = [];
    s.enemyBullets = [];
    s.beams = [];
    s.storm = null;
    s.meteors = null;
    s.hazards = [];
    this.beamClock = 3;
    this.enemyClock = 0;
    this.clearInput();
    this.notice("WARNING · CAPITAL SHIP", 1.5);
  }
  private checkBoss() {
    const s = this.state;
    if (s.miniBoss && s.miniBoss.health <= 0) {
      const m = s.miniBoss;
      this.awardDestruction(250);
      for (const [i, kind] of (
        ["weapon", s.lives < 3 ? "repair" : "drone"] as PickupKind[]
      ).entries())
        s.pickups.push({
          x: m.x + (i - 0.5) * 28,
          y: m.y,
          age: 0,
          value: 0,
          kind,
        });
      this.explode(m.x, m.y, this.config.stage===2?"nautolan-mini":`void-2-${this.config.stage}`, 150);
      s.miniBoss = null;
      s.enemyBullets = [];
      this.event("mini-destroyed", "TARGET DESTROYED");
    }
    if (!s.boss || s.boss.health > 0 || s.gameOver) return;
    if (s.boss.state) s.boss.state = "defeated";
    this.explode(s.boss.x, s.boss.y, `capital-${this.config.stage}`, 210);
    for (let i = 0; i < 4; i++) {
      this.explode(
        s.boss.x + (i % 2 ? 1 : -1) * 45,
        s.boss.y + Math.floor(i / 2) * 50 - 25,
        undefined,
        110,
      );
      s.explosions[s.explosions.length - 1].age = -i * 0.06;
    }
    this.awardDestruction(1500);
    this.event("boss-destroyed");
    s.enemyBullets = [];
    s.beams = [];
    if (this.config.mode === "endless") {
      s.boss = null;
      this.cycleStart = s.time;
      this.director.reset();
      s.wave++;
      this.config.stage = (this.config.stage + 1) % 3;
      this.bossAt = s.time + 90;
      this.waveAt = s.time + 30;
      this.lastFormation = "";
      this.clearInput();
    } else this.finish("won");
  }
  private collect(kind: PickupKind) {
    const s = this.state;
    let effect: PickupCollected["effect"] = kind;
    if (
      (kind === "repair" && s.lives >= 3) ||

      (kind === "shield" && s.shield)
    )
      effect = "score";
    if (effect === "score") s.score += 75;
    else if (kind === "weapon") {
      const before = s.evolution.level;
      s.evolution.orbs++;
      s.evolution.level =
        s.evolution.orbs >= 5 ? 3 : s.evolution.orbs >= 2 ? 2 : 1;
      s.powers.weapon = s.evolution.level - 1;
      if (s.evolution.level > before) {
        s.evolution.transformRemaining = 0.45;
        s.invincible = Math.max(s.invincible, 0.6);
        this.notice(`EVOLUTION · LEVEL ${s.evolution.level}`, 1.2);
      } else if (before === 3) s.score += 75;
      s.powers.overdrive = 25;
    } else if (kind === "repair") s.lives = Math.min(3, s.lives + 1);
    else if (kind === "energy") s.energy = Math.min(100, s.energy + 5);
    else if (kind === "shield") s.shield = true;
    else if (kind === "missile")
      s.powers.missile = Math.min(24, s.powers.missile + 12);
    else if (kind === "drone" && s.wingmen.level >= 3) {
      s.superMode.remaining = 5;
      effect="super";
      this.notice("SUPER MODE · 5 SECONDS", 1.2);
    }
    else if (kind === "drone") {
      s.wingmen.level = (s.wingmen.level + 1) as 1 | 2 | 3;
      if (!s.drones.length)
        s.drones = [
          { id: ++this.droneId, side: -1, rank: 0 },
          { id: ++this.droneId, side: 1, rank: 0 },
        ];
      s.powers.drone = s.wingmen.level;
    }
    s.pickupCount++;
    this.events.push({
      id: ++this.eventId,
      type: "pickup",
      data: { kind, effect },
    });
  }
  update(
    dt: number,
    axes: Axes,
    target: { x: number; y: number } | null = null,
  ) {
    const s = this.state;
    if (s.gameOver) return;
    const step = clamp(dt, 0, 0.05);
    if (!step) return;
    const stage = this.config.stage,
      endless = this.config.mode === "endless";
    s.time += step;
    s.superMode.remaining = Math.max(0, s.superMode.remaining - step);
    this.updateHazards(step);
    const supplyTimes = ORB_SUPPLY_TIMES;
    while (
      this.supplyIndex < supplyTimes.length &&
      s.time >= supplyTimes[this.supplyIndex]
    ) {
      const side = this.supplyIndex++ % 2 === 0 ? -1 : 1;
      if (s.evolution.orbs < 5)
        s.pickups.push({
          x: clamp(s.ship.x + side * 60, 30, 360),
          y: Math.max(120, s.ship.y - 160),
          age: 0,
          value: 0,
          kind: "weapon",
        });
    }
    s.evolution.transformRemaining = Math.max(
      0,
      s.evolution.transformRemaining - step,
    );
    const elapsed = s.time - this.cycleStart;
    s.segment = s.boss ? 3 : waveAt(endless ? (elapsed * 120) / 90 : elapsed);
    for (const event of this.director.advance(
      endless ? (elapsed * 120) / 90 : elapsed,
    )) {
      if (event.kind === "mini-warning")
        this.notice("WARNING · ELITE COMMANDER");
      if (event.kind === "mini-spawn" && !s.boss)
        s.miniBoss = {
          x: 195,
          y: 145,
          radius: 38,
          health: 120 + stage * 60,
          maxHealth: 120 + stage * 60,
          shot: 1.5,
        };
      if (event.kind === "boss-warning") this.notice("WARNING · CAPITAL SHIP");
      if (event.kind === "boss-spawn" && s.miniBoss) {
        s.miniBoss = null;
        this.notice("TARGET ESCAPED");
      }
      if (event.kind === "storm" && !s.boss) {
        s.storm = { x: 45 + stage * 60, width: 105, age: 0 };
        this.notice("MAGNETIC STORM", 1.2);
      }
      if (event.kind === "meteors" && !s.boss && !s.storm) {
        s.meteors = {
          safeX: 65 + ((stage + (event.at > 40 ? 1 : 0)) % 3) * 130,
          age: 0,
          spawned: false,
        };
        this.notice("METEOR SHOWER", 1);
      }
    }
    if (endless && !s.boss && s.time >= this.waveAt && s.time < this.bossAt) {
      s.wave++;
      this.waveAt += 30;
    }
    if (!s.boss && (endless ? s.time >= this.bossAt : s.time >= 120))
      this.startBoss();
    if (s.warningUntil <= s.time) s.warning = "";
    s.energy = Math.min(100, s.energy + (step * 100) / 75);
    s.powers.missile = Math.max(0, s.powers.missile - step);
    s.powers.overdrive = Math.max(0, s.powers.overdrive - step);
    if (s.powers.overdrive <= 0) s.laserInterceptor = false;
    this.laserBlockBudget = 0;
    for (const key of [
      "invincible",
      "dodgeCooldown",
      "dodgeTime",
      "empEffect",
      "hitEffect",
      "laser",
    ] as const)
      s[key] = Math.max(0, s[key] - step);
    this.actionLock = Math.max(0, this.actionLock - step);
    s.explosions.forEach((e) => (e.age += step));
    s.explosions = s.explosions
      .filter((e) => e.age < (e.spark ? 0.24 : 0.65))
      .slice(-48);
    s.interceptions.forEach((e) => (e.age += step));
    s.interceptions = s.interceptions.filter((e) => e.age < 0.65);
    if (s.storm) {
      s.storm.age += step;
      if (s.storm.age >= 5.2) s.storm = null;
    }
    if (s.meteors) {
      const h = s.meteors;
      h.age += step;
      if (h.age >= 1 && !h.spawned) {
        h.spawned = true;
        for (let x = 35; x < 390; x += 64)
          if (Math.abs(x - h.safeX) > 65)
            s.rocks.push({
              x,
              y: -30,
              radius: 18,
              speed: 135,
              spin: 1,
              phase: 0,
              target: true,
            });
      }
      if (h.age >= 5) s.meteors = null;
    }
    const desired = target
      ? {
          x: clamp((target.x - s.ship.x) * 10, -310, 310),
          y: clamp((target.y - s.ship.y) * 10, -310, 310),
        }
      : { x: clamp(axes.x, -1, 1) * 310, y: clamp(axes.y, -1, 1) * 310 };
    if (
      s.storm &&
      s.storm.age >= 1.2 &&
      s.ship.x >= s.storm.x &&
      s.ship.x <= s.storm.x + s.storm.width
    ) {
      desired.x *= 0.7;
      desired.y *= 0.7;
    }
    const blend = 1 - Math.exp(-step / 0.055);
    this.velocity.x += (desired.x - this.velocity.x) * blend;
    this.velocity.y += (desired.y - this.velocity.y) * blend;
    const next = clampShip(
      s.ship.x + this.velocity.x * step,
      s.ship.y + this.velocity.y * step,
    );
    Object.assign(s.ship, next);
    s.velocity = { ...this.velocity };
    if (next.x === WORLD.margin || next.x === WORLD.width - WORLD.margin)
      this.velocity.x = 0;
    if (next.y === 100 || next.y === WORLD.height - 35) this.velocity.y = 0;
    for (const p of s.pickups) {
      p.age += step;
      const dx = s.ship.x - p.x,
        dy = s.ship.y - p.y,
        d = Math.hypot(dx, dy);
      if (d < 150) {
        const lerp = 1 - Math.exp(-step * 7);
        p.x += dx * lerp;
        p.y += dy * lerp;
      } else p.y += 35 * step;
      if (Math.hypot(s.ship.x - p.x, s.ship.y - p.y) < 16) {
        if (p.kind) this.collect(p.kind);
        p.age = 20;
      }
    }
    s.pickups = s.pickups
      .filter((p) => p.age < 15 && p.y < 750)
      .slice(-LIMITS.pickups);
    this.fire(step * (s.weaponJammed ? 0.5 : 1));
    this.spawnClock += step;
    this.enemyClock += step;
    if (!s.boss && this.spawnClock > 3.2) {
      this.spawnClock = 0;
      const radius = 15 + this.random() * 12;
      s.rocks.push({
        x: 30 + this.random() * 330,
        y: -40,
        radius,
        speed: 90 + this.random() * 60,
        spin: (this.random() - 0.5) * 1.8,
        phase: 0,
        target: this.random() > 0.5,
        iron: stage === 0 && this.random() < 0.15,
        vx: stage === 0 ? (this.random() - 0.5) * 80 : 0,
      });
    }
    if(stage===0 && s.rocks.length && this.spawnClock===0) {
      const rock=s.rocks[s.rocks.length-1];
      if(this.random()<0.35) {const left=this.random()<0.5;rock.x=left?-35:425;rock.y=80+this.random()*170;rock.vx=left?85:-85;rock.speed=65;}
    }
    const support = s.boss
      ? Math.max(
          5.5,
          9.5 -
            stage -
            (s.boss.phase ?? 1) * 0.7 -
            Math.max(0, (s.boss.age ?? 0) - 180) / 60,
        )
      : Math.max(2.4, 4.2 - stage * 0.3 - s.segment * 0.35);
    const waveBalance=getStageBalance(stage,s.time,this.config.mode,!!s.boss);
    if(waveBalance && !waveBalance.spawnEnabled) this.enemyClock=0;
    const spawnInterval=waveBalance?.spawnInterval ?? (s.time<3?1.5:support/Math.sqrt(DIFFICULTY[stage].cadence));
    if ((!waveBalance || waveBalance.spawnEnabled) && this.enemyClock >= spawnInterval) {
      this.enemyClock = 0;
      this.spawnFormation(!!s.boss);
    }
    for (const e of s.enemies) {
      e.muzzle = Math.max(0,(e.muzzle??0)-step);
      e.flash = Math.max(0, (e.flash ?? 0) - step);
      e.stun = Math.max(0, (e.stun ?? 0) - step);
      if (e.stun > 0) continue;
      e.age = (e.age ?? 0) + step;
      const a = e.age,
        origin = e.originX ?? e.x;
      if (e.archetype === "kamikaze" && a > 1.2) {
        e.lock ??= { x: s.ship.x, y: s.ship.y };
        if (a > 2) {
          const dx = e.lock.x-e.x, dy=e.lock.y-e.y, d=Math.hypot(dx,dy)||1;
          const speed=e.balance?GAME_BALANCE_CONFIG.movement.kamikaze:270;
          e.x += dx/d*speed*step; e.y += dy/d*speed*step;
          if(d<14) e.lock={x:e.x,y:900};
        }
      } else if (a > 5.5) {
        // After attacking, fly through the bottom of the playfield instead
        // of abruptly shooting sideways off screen.
        e.y += (e.balance?GAME_BALANCE_CONFIG.movement.retreat:150) * (e.balance?.movementScale??1) * step;
      } else if(e.archetype==='crossfire') {
        e.x=origin+(origin<195?1:-1)*Math.min(a*(e.balance?GAME_BALANCE_CONFIG.movement.crossfireX:60)*(e.balance?.movementScale??1),115);e.y+=(e.balance?GAME_BALANCE_CONFIG.movement.crossfireY:15)*(e.balance?.movementScale??1)*step;
      } else if (e.path) {
        Object.assign(e, flightPathPosition(e.path, a / 5.5));
      } else {
        if (e.motion === "turrets" && e.y > 95 && a < 6) e.y += 0;
        else
          e.y += (e.motion === "bombers" ? (e.balance?GAME_BALANCE_CONFIG.movement.bomber:135) : e.kind === 1 ? (e.balance?GAME_BALANCE_CONFIG.movement.gunner:82) : (e.balance?GAME_BALANCE_CONFIG.movement.fighter:60)) * (e.balance?.movementScale??1) * step;
        if (e.motion === "zigzag")
          e.x = clamp(origin + Math.sin(a * 2.4 + e.phase) * 90, 26, 364);
        else if (e.motion === "semicircle" || e.motion === "pincer")
          e.x = clamp(
            origin + Math.sin(a * 0.9) * (origin < 195 ? 85 : -85),
            26,
            364,
          );
        else if (e.motion === "crossfire")
          e.x = clamp(origin + (origin < 195 ? 1 : -1) * a * 38, 26, 364);
        else if (e.motion === "spiral")
          e.x = clamp(origin + Math.sin(a * 2 + e.phase) * 65, 26, 364);
        else if (e.motion === "wall" || e.motion === "escort")
          e.x = clamp(origin + Math.sin(a * 0.8) * 18, 26, 364);
      }
      const visible=e.y>35 && e.y<460 && e.x>18 && e.x<372;
      if(e.balance && !e.hasFired) e.visibleTime=visible?(e.visibleTime??0)+step:0;
      e.shot -= step;
      if (
        (!e.balance || e.hasFired || (e.visibleTime??0)>=e.balance.firstVisibleDelay) &&
        e.archetype !== "kamikaze" &&
        e.shot <= 0 &&
        e.y > 35 &&
        e.y < 460 &&
        e.x > 18 &&
        e.x < 372 &&
        !s.beams.length &&
        !(s.boss && (s.boss.restUntil ?? 0) > s.time)
      ) {
        e.shot = (e.kind === 2 ? 2.7 : 2.2) / (e.balance?.cadence ?? DIFFICULTY[stage].cadence);
        e.hasFired=true;
        e.muzzle=0.1;
        if(e.archetype === "crossfire") {
          this.fan(e.x,e.y,3,132*(e.balance?.projectileScale??1),Math.atan2(s.ship.x-e.x,Math.max(70,s.ship.y-e.y)),0.12);
        } else if (e.archetype === "rear-gunner") {
          const angle = Math.atan2(s.ship.x-e.x,s.ship.y-e.y);
          this.pushPatternShot({x:e.x,y:e.y+14,radius:5,vx:Math.sin(angle)*120*(e.balance?.projectileScale??1),vy:Math.cos(angle)*120*(e.balance?.projectileScale??1),homing:true,age:0});
        } else if (e.kind === 2) this.ring(e.x, e.y + 18, 103*(e.balance?.projectileScale??1), e.phase * 0.08);
        else
          this.fan(
            e.x,
            e.y + 14,
            s.segment === 0 ? 1 : 3,
            132*(e.balance?.projectileScale??1),
            Math.atan2((s.ship.x - e.x) * 0.35, Math.max(100, s.ship.y - e.y)),
            0.2,
          );
      }
    }
    if (s.miniBoss) {
      const m = s.miniBoss;
      m.x = 195 + Math.sin(s.time * 0.9) * 95;
      m.shot -= step;
      if (m.shot <= 0) {
        m.shot = 1.7;
        this.ring(m.x, m.y + 25, 112, s.time * 0.1);
      }
    }
    this.updateBoss(step);
    for (const b of s.beams) {
      b.age += step;

      if (
        b.age >= 1.2 &&
        b.age < (b.sweep ? 2.6 : 1.8) &&
        beamDistance(s.ship,b) < 22 + s.ship.radius
      )
        this.damage("beam");
    }
    s.beams = s.beams.filter((b) => b.age < (b.sweep ? 2.6 : 1.8));
    for (const r of s.rocks) {
      r.y += r.speed * step;
      r.x += (r.vx ?? 0) * step;
      r.phase += r.spin * step;
    }
    for (const b of s.bullets) {
      b.prevX = b.x;
      b.prevY = b.y;
      if (b.missile) {
        b.age = (b.age ?? 0) + step;
        const targets = this.guidedTargets();
        let nearest: Body | undefined;
        let distance = Infinity;
        for (const t of targets) {
          const d = Math.hypot(t.x - b.x, t.y - b.y);
          if (d < distance) {
            nearest = t;
            distance = d;
          }
        }
        if (nearest) {
          const d = distance || 1,
            lerp = 1 - Math.exp(-step * 6);
          b.vx =
            (b.vx ?? 0) + (((nearest.x - b.x) / d) * 320 - (b.vx ?? 0)) * lerp;
          b.speed += ((-(nearest.y - b.y) / d) * 320 - b.speed) * lerp;
        }
      }
      b.y -= b.speed * step;
      b.x += (b.vx ?? 0) * step;
    }
    for (const b of s.enemyBullets) {
      b.prevX = b.x;
      b.prevY = b.y;
      b.age=(b.age??0)+step;
      if(b.homing && b.age<2) {
        const angle=Math.atan2(s.ship.y-b.y,s.ship.x-b.x),speed=Math.hypot(b.vx,b.vy),t=1-Math.exp(-step*0.65);
        b.vx+=(Math.cos(angle)*speed-b.vx)*t;b.vy+=(Math.sin(angle)*speed-b.vy)*t;
      }
      b.x += b.vx * step;
      b.y += b.vy * step;
    }
    this.collisions();
    this.checkBoss();
    s.bullets = s.bullets
      .filter(
        (b) =>
          b.y > -40 && b.y < 750 && b.x > -30 && b.x < 420 && (b.age ?? 0) < 5,
      )
      .slice(-LIMITS.playerBullets);
    s.enemies = s.enemies
      .filter(
        (e) =>
          e.health > 0 && e.y < 765 && e.y > -180 && e.x > -90 && e.x < 480,
      )
      .slice(-LIMITS.enemies);
    s.rocks = s.rocks.filter((r) => r.y < 765 && r.x>-100 && r.x<490).slice(-48);
    s.pickups = s.pickups.slice(-LIMITS.pickups);
    s.explosions = s.explosions.slice(-48);
    if (this.events.length > 64) this.events = this.events.slice(-64);
  }
  private fire(step: number) {
    const s = this.state,
      stage = this.config.stage;
    const main =
        this.config.equipment.main === "laser"
          ? "laser"
          : this.weapon === "spread"
            ? "plasma"
            : "pulse",
      level = s.evolution.level;
    this.shotClock += step;
    const interval = main === "plasma" ? 0.108 : main === "laser" ? 0.1 : 0.072;
    while (this.shotClock >= interval) {
      this.shotClock -= interval;
      this.fireCount++;
      if (main === "laser") {
        s.laser = 0.12;
        s.laserInterceptor = (s.superMode.remaining > 0 || s.powers.overdrive > 0 && this.fireCount % 3 === 0);
        if (s.laserInterceptor) this.laserBlockBudget += 2;
        for(const d of s.boss?.decoys??[]) if(Math.abs(s.ship.x-d.x)<25+6+s.powers.weapon*14 && d.y-35-(6+s.powers.weapon*14)<s.ship.y-25)
          this.hitBoss(0,d.x,s.ship.y-25,6+s.powers.weapon*14,true);
        const targets = [
          ...s.enemies.filter((e) => e.health > 0),
          ...(s.miniBoss ? [s.miniBoss] : []),
          ...(s.boss ? [s.boss] : []),
        ]
          .filter((e) =>
            e === s.boss
              ? findBossHit(
                  e as Boss,
                  s.ship.x,
                  s.ship.y - 25,
                  6 + s.powers.weapon * 14,
                  true,
                ) !== null
              : e.y < s.ship.y &&
                Math.abs(e.x - s.ship.x) < e.radius + 6 + s.powers.weapon * 14,
          )
          .sort((a, b) => b.y - a.y)
          .slice(0, 3);
        const well=s.hazards.find(h=>h.kind==='black-hole' && h.y<s.ship.y && Math.abs(h.x-s.ship.x)<24);
        if(well) {well.hp-=0.97*superMultiplier(s.superMode)*[1,1.6,2.3][level-1];if(well.hp<=0)this.explode(well.x,well.y,undefined,110);}
        for (const t of targets) {
          const damage =
            0.97 * standardImpact((t as Enemy).balanceGroup,!!(t as Enemy).balance,"laser") * superMultiplier(s.superMode) *
            [1, 1.6, 2.3][level - 1] *
            damageMultiplier(
              "laser",
              false,
              false,
              t === s.boss ? STAGES[stage].weakness : undefined,
            );
          if (t === s.boss)
            this.hitBoss(
              damage,
              s.ship.x,
              s.ship.y - 25,
              6 + s.powers.weapon * 14,
              true,
            );
          else {
            if((t as Enemy).shieldHP && (t as Enemy).shieldHP!>0) (t as Enemy).shieldHP=Math.max(0,(t as Enemy).shieldHP!-damage);
            else t.health -= damage;
            if (t === s.miniBoss) this.markHit(t);
            else {
              const e = t as Enemy;
              this.markHit(e);
              if (e.health <= 0) this.kill(e);
            }
          }
          this.spark(s.ship.x, t.y);
        }
      } else
        for (const [index, shot] of weaponVolley(main, level).entries()) {
          const angle = (shot.angle * Math.PI) / 180;
          s.bullets.push({
            x: s.ship.x + shot.offset,
            y: s.ship.y - 25,
            radius: 4,
            speed: Math.cos(angle) * 530,
            vx: Math.sin(angle) * 530,
            damage: shot.damage * 0.7 * superMultiplier(s.superMode),
            interceptor:
              (s.superMode.remaining > 0 || s.powers.overdrive > 0 && (this.fireCount + index) % 3 === 0),
            type: main,
          });
        }
    }
    this.missileClock += step;
    this.droneClock += step;
    if (s.powers.missile > 0 && this.missileClock >= 1.6) {
      this.missileClock = 0;
      for (const side of [-1, 1])
        s.bullets.push({
          x: s.ship.x + side * 15,
          y: s.ship.y - 5,
          radius: 5,
          speed: 280,
          vx: side * 45,
          damage: 1.5 * superMultiplier(s.superMode),
          type: "missile",
          missile: true,
          age: 0,
        });
    }
    const wingLevel = s.wingmen.level;
    const wingInterval = wingLevel === 1 ? 0.3 : 0.25;
    if (wingLevel && s.drones.length && this.droneClock >= wingInterval) {
      this.droneClock = 0;
      for (const d of s.drones) {
        const p = dronePosition(s.ship, d);
        const targets = this.guidedTargets().filter((e) => e.y < p.y);
        const target = targets.sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
        const angle = target
          ? Math.atan2(target.x - p.x, p.y - target.y)
          : 0;
        for (const offset of wingLevel === 3 ? [-4, 4] : [0])
          s.bullets.push({
            x: p.x + offset,
            y: p.y,
            radius: 3,
            speed: Math.cos(angle) * 500,
            vx: Math.sin(angle) * 500,
            damage: (wingLevel === 1 ? 0.45 : wingLevel === 2 ? 0.5625 : 0.5) * superMultiplier(s.superMode),
            interceptor: s.superMode.remaining > 0,
            type: "pulse",
          });
      }
    }
  }
  advanceEnding(dt: number) {
    const ending = this.state.ending;
    if (!ending || ending.elapsed >= ending.duration) return;
    ending.elapsed = Math.min(ending.duration, ending.elapsed + Math.min(0.05, Math.max(0, dt)));
  }
  private updateHazards(step: number) {
    const s = this.state, stage = this.config.stage;
    const slot = Math.floor(s.time / 18);
    const previous = Math.floor((s.time - step) / 18);
    if (slot !== previous && s.time > 20 && !s.beams.length && !s.hazards.length && !s.boss?.dash) {
      if (stage > 0) {
        const kind = slot % 2 === 0 ? 'black-hole' : stage === 1 ? 'plasma' : 'grid';
        s.hazards.push({ kind, x: clamp(s.ship.x + (slot % 2 ? 80 : -80),70,320), y: kind === 'black-hole' ? 360 : 440, age:0, radius:kind === 'plasma' ? 95 : 80, hp:24 });
        this.notice(kind === 'black-hole' ? 'GRAVITY WELL' : kind === 'plasma' ? 'PLASMA FIELD' : 'DEFENSE GRID',1.2);
      }
    }
    s.weaponJammed = false;
    for (const h of s.hazards) {
      h.age += step;
      if (h.kind === 'plasma') {
        h.y += 18*step;
        if(h.age >= 1.2 && Math.hypot(s.ship.x-h.x,s.ship.y-h.y)<h.radius) s.weaponJammed=true;
      } else if(h.kind === 'black-hole' && h.age >= 1.2 && h.age < 8) {
        const pull = (body: Body, strength:number) => {
          const dx=h.x-body.x,dy=h.y-body.y,d=Math.hypot(dx,dy);
          if(d>1 && d<170) {const v=strength*(1-d/170)*step;body.x+=dx/d*v;body.y+=dy/d*v;}
        };
        pull(s.ship,310*0.35);
        Object.assign(s.ship,clampShip(s.ship.x,s.ship.y));
        for(const b of s.bullets) pull(b,100);
        for(const b of s.enemyBullets) {
          const old={x:b.x,y:b.y};pull(b,100);
          if(s.boss && threatensPassage(b,b.lane??s.boss.safeLaneX??195,90)) Object.assign(b,old);
        }
      } else if(h.kind === 'black-hole' && h.age >= 9) {
        if(Math.hypot(s.ship.x-h.x,s.ship.y-h.y)<h.radius) this.damage('beam');
      } else if(h.kind === 'grid' && h.age >= 1.2 && h.age < 1.8 && Math.abs(s.ship.x-h.x)<24+s.ship.radius) this.damage('beam');
    }
    s.hazards=s.hazards.filter(h=>h.hp>0 && h.age<(h.kind==='black-hole'?9.2:h.kind==='plasma'?7:1.8));
  }
  private markHit(target: { flash?: number; flashAt?: number }) {
    if (this.state.time - (target.flashAt ?? -10) >= 0.1) {
      target.flash = 0.05;
      target.flashAt = this.state.time;
    }
  }
  private guidedTargets(): Body[] {
    const s = this.state;
    if (s.boss?.state === "armored" || s.boss?.state === "exposed")
      return bossAimPoints(s.boss);
    return [
      ...s.enemies.filter((e) => e.health > 0),
      ...(s.miniBoss ? [s.miniBoss] : []),
      ...(s.boss ? bossAimPoints(s.boss) : []),
    ];
  }
  private hitBoss(
    damage: number,
    x: number,
    y: number,
    radius = 0,
    laser = false,
  ) {
    const b = this.state.boss;
    if (!b || b.state === "transition" || b.state === "defeated") return false;
    for(const d of b.decoys??[]) if(Math.abs(x-d.x)<25+radius && (laser ? d.y-35-radius<y : Math.abs(y-d.y)<35+radius)) {
      if((b.decoyCooldown??0)<=0 && !this.state.beams.length) { b.decoyCooldown=1.2;this.ring(d.x,d.y,100,0,24); }
      this.spark(x,d.y);return false;
    }
    const hit = findBossHit(b, x, y, radius, laser);
    if (!hit) return false;
    if (hit === "core" && b.state === "armored") {
      this.spark(x, laser ? b.y : y);
      return false;
    }
    if (hit !== "core") {
      hit.health -= damage;
      this.markHit(hit);
      if (hit.health <= 0) {
        this.explode(b.x + hit.x, b.y + hit.y, undefined, 75);
        this.state.score += 125;
        if (b.state === "armored" && b.turrets!.every((t) => t.health <= 0)) {
          b.state = "exposed";
          this.notice("CORE EXPOSED", 1.2);
        }
      }
    } else if (b.state === "exposed") {
      const phase = b.phase ?? 1;
      const phases = DIFFICULTY[this.config.stage].phases;
      const threshold = (b.maxHealth * (phases - phase)) / phases;
      b.health = Math.max(threshold, b.health - damage * DIFFICULTY[this.config.stage].exposedDamage);
      if (b.health <= threshold && phase < phases) {
        b.phase = phase + 1;
        b.state = "transition";
        b.transitionRemaining = 1.5;
        b.shot = 1.5;
        b.attackSerial = 0;
        b.restUntil = this.state.time + 1.5;
        b.safeLaneX = clamp(
          this.state.ship.x + (b.phase === 2 ? -70 : 70),
          65,
          325,
        );
        this.state.enemyBullets = [];
        this.state.beams = [];
        this.state.hazards=[];
        this.beamClock = 2;
        this.stationary = 0;
        this.event("phase", `PHASE ${b.phase}`);
        this.notice(`REARMING · PHASE ${b.phase}`, 1.5);
      } else if (b.health <= 0) b.state = "defeated";
    } else b.health -= damage;
    this.markHit(b);
    this.spark(x, laser ? (hit === "core" ? b.y : b.y + hit.y) : y);
    return true;
  }
  private updateBoss(step: number) {
    const s=this.state,b=s.boss;
    if(!b) return;
    const stage=this.config.stage,profile=DIFFICULTY[stage];
    if(!b.state) {
      const derived=Math.min(profile.phases,Math.floor((1-b.health/b.maxHealth)*profile.phases)+1);
      if(b.phase!==derived) {s.enemyBullets=[];s.beams=[];b.shot=1.2;}
      b.phase=derived;
    }
    const phase=b.phase??1;
    b.muzzle=Math.max(0,(b.muzzle??0)-step);
    b.age=(b.age??0)+step;b.flash=Math.max(0,(b.flash??0)-step);
    b.decoyCooldown=Math.max(0,(b.decoyCooldown??0)-step);
    if(b.state==='transition') {
      b.decoys=[];
      b.transitionRemaining=Math.max(0,(b.transitionRemaining??0)-step);
      if(b.transitionRemaining>0) return;
      const hp=10+phase*5;
      b.turrets=BOSS_ART[stage].mounts.map(m=>({x:m.x*BOSS_ART[stage].width,y:m.y*BOSS_ART[stage].width,health:hp,maxHealth:hp,flash:0}));
      b.state='armored';b.shot=0.5;this.notice('BREAK THE TURRETS',1.2);
    }
    if(b.state==='armored' && b.turrets?.every(t=>t.health<=0)) {b.state='exposed';this.notice('CORE EXPOSED',1.2);}
    if(stage===2 && !b.rage && b.health/b.maxHealth<0.2) {
      b.rage=true;s.enemyBullets=[];s.hazards=[];s.beams=[];
      b.restUntil=s.time+1.2;b.shot=1.2;this.event('warning','REACTOR OVERLOAD · RAGE');this.notice('RAGE MODE',1.2);
    }
    b.x=195+Math.sin(b.age*0.42)*(stage===2?43:65);
    b.decoys=stage>0 && phase===2 ? [{x:65,y:b.y+45},{x:325,y:b.y+45}] : [];
    if(b.dash) {
      b.dash.age+=step;
      const d=b.dash;
      if(d.age<1.2) {this.notice('CHARGE LOCK',0.1);s.enemyBullets=[];}
      else if(d.age<1.8) {
        const t=Math.min(1,(d.age-1.2)/0.6);b.x=195+(d.x-195)*t;b.y=205+(d.y-205)*t;
      } else if(d.age<2.6) {
        const t=(d.age-1.8)/0.8;b.x=d.x+(195-d.x)*t;b.y=d.y+(205-d.y)*t;
      } else {b.dash=undefined;b.y=205;b.restUntil=s.time+0.8;}
      return;
    }
    for(const t of b.turrets??[]) t.flash=Math.max(0,t.flash-step);
    this.beamClock-=step;
    b.shot-=step;
    if(b.shot>0 || s.beams.length || (b.restUntil??0)>s.time || s.hazards.some(h=>h.kind!=='plasma')) return;
    const serial=(b.attackSerial??0)+1;b.attackSerial=serial;
    // Keep the old corridor until the preceding shots leave the lower arena.
    // This prevents an old and a new volley from closing each other's exits.
    if(s.enemyBullets.some(q=>q.source==='boss' && q.y>=0 && q.y<=710 && q.vy>0)) {b.shot=0.12;b.attackSerial=serial-1;return;}
    const previousLane=b.safeLaneX??195;
    const desired=nextEscapeLane(previousLane,s.ship.x,serial);
    const candidates=[desired,Math.max(65,previousLane-60),Math.min(325,previousLane+60),previousLane];
    b.safeLaneX=candidates.find(lane=>!s.enemyBullets.some(round=>threatensPassage(round,lane,90)))??previousLane;
    const live=(b.turrets??[]).filter(t=>t.health>0);
    const speed=Math.min(1.4,1+stage*0.08+(s.wave-1)*0.025);
    const count=live.length?13+phase*2:9+phase*2;
    const rage=b.rage?2:1;
    b.pattern=b.rage && serial%5===0?'dash':b.rage && serial%5===1?'overload':serial%3===0?'ring':serial%3===1?'spiral':'aimed';
    if(b.pattern==='dash') {
      s.hazards=[];s.enemyBullets=[];b.dash={age:0,x:clamp(s.ship.x,65,325),y:Math.min(470,s.ship.y)};return;
    }
    if(b.pattern==='overload' || phase===profile.phases && serial%5===0) {
      s.enemyBullets=[];s.hazards=[];
      s.beams=[{x:b.pattern==='overload'?b.x:clamp(s.ship.x,40,350),y:b.pattern==='overload'?b.y:s.ship.y,age:0,sweep:b.pattern==='overload'}];
      this.event('warning',b.pattern==='overload'?'OVERLOAD SWEEP':'ORBITAL LOCK');
      b.shot=2.4;return;
    }
    // A packet contains closely spaced pulses. Each packet uses a single
    // escape corridor; the next corridor is selected only after it clears.
    const pulses=Math.min(8,profile.cadence*rage);
    this.emittingBoss=true;
    for(let pulse=0;pulse<pulses;pulse++) {
      const y=b.y+45-pulse*22;
      if(b.pattern==='ring') this.ring(b.x,y,100,b.age*0.1+pulse*0.08,live.length?20+live.length*6:20);
      else {
        const active=live.length?live.filter((_,i)=>i%2===serial%2):[{x:0,y:25}];
        for(const t of active) {
          const x=b.x+t.x;
          const aim=b.pattern==='aimed'?Math.atan2(s.ship.x-x,Math.max(120,s.ship.y-y)):Math.sin(serial*0.7+pulse*0.15)*0.55;
          this.fan(x,y,count,112,aim,0.14);
        }
      }
    }
    this.emittingBoss=false;
    b.muzzle=0.1;
    // Homing does not operate inside boss packets; it could close a planned gap.
    b.shot=Math.max(0.45,(live.length?1.1:1.4)/Math.sqrt(profile.cadence)/rage);
    b.restUntil=s.time+0.3;
  }
  private pushHostile(b: EnemyBullet) {
    if (this.state.enemyBullets.length < LIMITS.enemyBullets)
      this.state.enemyBullets.push(b);
  }
  private pushPatternShot(b: EnemyBullet) {
    const boss = this.state.boss;
    // Each authored volley reserves its phase's escape sector; raw admission never erases attacks.
    if (boss && threatensPassage(b, boss.safeLaneX ?? 265, 90)) return;
    b.source=this.emittingBoss?"boss":"escort";
    b.lane=boss?.safeLaneX;
    if(boss) b.homing=false;
    this.pushHostile(b);
  }
  private interceptShots() {
    const s = this.state,
      spent = new Set<Bullet>(),
      removed = new Set<EnemyBullet>();
    if (this.laserBlockBudget > 0 && (s.powers.overdrive > 0 || s.superMode.remaining > 0)) {
      const targets = s.enemyBullets
        .filter(
          (b) =>
            b.y < s.ship.y - 20 &&
            Math.abs(b.x - s.ship.x) < 6 + s.powers.weapon * 14 + b.radius,
        )
        .sort((a, b) => b.y - a.y);
      for (const b of targets.slice(0, this.laserBlockBudget)) {
        removed.add(b);
        this.spark(b.x, b.y);
        s.intercepted++;
      }
    }
    const red = s.bullets.filter((b) => b.interceptor);
    if (red.length && s.enemyBullets.length) {
      const grid = new ProjectileGrid(
        s.enemyBullets.filter((b) => !removed.has(b)),
      );
      for (const b of red)
        for (const hostile of grid.nearby(b)) {
          if (removed.has(hostile) || !sweptContact(b, hostile)) continue;
          removed.add(hostile);
          spent.add(b);
          s.intercepted++;
          this.spark(hostile.x, hostile.y);
          break;
        }
    }
    if (removed.size)
      s.enemyBullets = s.enemyBullets.filter((b) => !removed.has(b));
    if (spent.size) s.bullets = s.bullets.filter((b) => !spent.has(b));
  }
  private collisions() {
    this.interceptShots();
    const s = this.state,
      spent = new Set<Bullet>(),
      rocks = new Set<Rock>();
    for (const b of s.bullets) {
      const well=s.hazards.find(h=>h.kind==='black-hole' && h.hp>0 && Math.hypot(b.x-h.x,b.y-h.y)<18+b.radius);
      if(well) {well.hp-=b.damage??1;spent.add(b);this.spark(b.x,b.y);if(well.hp<=0)this.explode(well.x,well.y,undefined,110);continue;}
      for (const r of s.rocks)
        if (!rocks.has(r) && collides(b, r)) {
          if(r.iron) {spent.add(b);this.spark(b.x,b.y);break;}
          spent.add(b);
          rocks.add(r);
          s.score += r.target ? 25 : 10;
          this.explode(r.x, r.y, "neon-rock", 65);
          if(this.config.stage===0 && !r.fragment && r.radius>14) for(const side of [-1,1]) s.rocks.push({...r,radius:9,fragment:true,vx:side*65,speed:r.speed*1.2});
          if (this.random() < 0.2)
            s.pickups.push({
              x: r.x,
              y: r.y,
              age: 0,
              value: 0,
              kind: (["repair", "repair", "repair", "repair", "energy", "energy", "energy", "weapon"] as const)[
                Math.floor(this.random() * 8) % 8
              ],
            });
          break;
        }
      if (spent.has(b)) continue;
      const e = s.enemies.find((e) => e.health > 0 && collides(b, e));
      if (e) {
        spent.add(b);
        this.markHit(e);
        this.spark(b.x, b.y);
        if((e.shieldHP??0)>0) {e.shieldHP=Math.max(0,e.shieldHP!-(b.damage??1)*(b.type==="plasma"?1.25:1));continue;}
        e.health -=
          (b.damage ?? 1) *
          damageMultiplier(b.type ?? "pulse", e.kind === 2, e.kind === 0) * standardImpact(e.balanceGroup,!!e.balance,b.type??"pulse");
        if (e.health <= 0) this.kill(e);
      } else if (s.miniBoss && collides(b, s.miniBoss)) {
        spent.add(b);
        s.miniBoss.health -= b.damage ?? 1;
        this.markHit(s.miniBoss);
        this.spark(b.x, b.y);
      } else if (s.boss) {
        const boss = s.boss;
        if (findBossHit(boss, b.x, b.y, b.radius) || boss.decoys?.some(d=>Math.hypot(d.x-b.x,d.y-b.y)<35+b.radius)) {
          spent.add(b);
          const damaged = this.hitBoss(
            (b.damage ?? 1) *
              damageMultiplier(
                b.type ?? "pulse",
                false,
                false,
                STAGES[this.config.stage].weakness,
              ),
            b.x,
            b.y,
            b.radius,
          );
          if (damaged) s.score += 2;
        }
      }
    }
    for (const r of s.rocks)
      if (!rocks.has(r) && collides(s.ship, r)) {
        rocks.add(r);
        this.damage("collision");
      }
    for (const e of s.enemies)
      if (e.health > 0 && collides(s.ship, e)) {
        e.health = 0;
        this.damage("collision");
      }
    s.enemyBullets = s.enemyBullets.filter((b) => {
      if (collides(s.ship, b)) {
        this.damage("bullet", b);
        return false;
      }
      return b.y < 750 && b.y > -40 && b.x > -30 && b.x < 420;
    });
    if (s.boss && collides(s.ship, s.boss)) this.damage("collision");
    if (s.miniBoss && collides(s.ship, s.miniBoss)) this.damage("collision");
    s.bullets = s.bullets.filter((b) => !spent.has(b));
    s.rocks = s.rocks.filter((r) => !rocks.has(r));
  }
}
