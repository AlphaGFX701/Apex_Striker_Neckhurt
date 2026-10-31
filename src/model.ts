import {
  StageWaveManager,
  waveAt,
  FORMATIONS,
  formationSpecs,
  seededRandom,
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
  enemies: 14,
  playerBullets: 360,
  enemyBullets: 360,
  pickups: 60,
  particles: 160,
};
export interface Body {
  x: number;
  y: number;
  radius: number;
}
export interface Rock extends Body {
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
  "weapon" | "missile" | "drone" | "shield" | "repair" | "energy";
export interface EnemyBullet extends Body {
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
  effect: PickupKind | "score";
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
  beams: { x: number; age: number; y?: number }[];
  drones: Drone[];
  interceptions: {
    fromX: number;
    fromY: number;
    x: number;
    y: number;
    age: number;
  }[];
  laser: number;
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
  return {
    x: clamp(ship.x + d.side * (42 + d.rank * 23), 12, 378),
    y: ship.y + 8 + d.rank * 23,
  };
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
    this.awardDestruction(e.kind === 2 ? 90 : 40);
    this.explode(
      e.x,
      e.y,
      `enemy-${e.faction ?? this.config.stage}-${e.kind ?? 0}`,
      e.kind === 2 ? 100 : 70,
    );
    this.killsSinceDrop++;
    if (e.kind === 2 || this.killsSinceDrop >= 5 || this.random() < 0.3) {
      const kinds: PickupKind[] =
        s.lives === 1
          ? [
              "weapon",
              "missile",
              "drone",
              "shield",
              "repair",
              "repair",
              "repair",
              "energy",
            ]
          : ["weapon", "missile", "drone", "shield", "repair", "energy"];
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
  private ring(x: number, y: number, speed: number, rotation = 0) {
    speed *= Math.min(
      1.4,
      1 + this.config.stage * 0.08 + (this.state.wave - 1) * 0.025,
    );
    const gap = Math.atan2(this.state.ship.y - y, this.state.ship.x - x) + 0.35;
    for (
      let i = 0;
      i < 24 && this.state.enemyBullets.length < LIMITS.enemyBullets;
      i++
    ) {
      const a = (i * Math.PI * 2) / 24 + rotation;
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
    let pool: readonly Formation[] =
      s.segment === 0
        ? FORMATIONS.slice(0, 2)
        : s.segment === 1
          ? FORMATIONS.filter((f) => f !== "wall")
          : FORMATIONS;
    if (bossSupport) pool = ["vee", "pincer", "escort", "zigzag"];
    const choices = pool.filter((f) => f !== this.lastFormation);
    const f =
      choices[Math.floor(this.random() * choices.length) % choices.length];
    this.lastFormation = f;
    s.formation = f;
    const specs = formationSpecs(f, stage, 85 + this.random() * 220);
    for (const e of bossSupport ? specs.slice(0, 2) : specs) {
      if (s.enemies.length >= (bossSupport ? 2 : 10 + stage * 2)) break;
      if (
        e.kind === 2 &&
        s.enemies.filter((other) => other.kind === 2).length >= 2
      )
        continue;
      if (bossSupport) {
        const leftOccupied = s.enemies.some(
          (ally) => (ally.originX ?? ally.x) < 195,
        );
        const rightOccupied = s.enemies.some(
          (ally) => (ally.originX ?? ally.x) >= 195,
        );
        if (leftOccupied && rightOccupied) break;
        e.x = leftOccupied ? 330 : 60;
        e.y = -35;
        e.motion = "escort";
        e.kind = 0;
      }
      s.enemies.push({
        ...e,
        radius: e.kind === 2 ? 22 : 16,
        health:
          (e.kind === 2 ? [6, 8, 10][stage] : [2, 2.5, 3][stage]) *
          Math.min(1.6, 1 + (s.wave - 1) * 0.025),
        shot: 0.6,
        originX: e.x,
        age: 0,
        faction: stage,
      });
    }
  }
  private startBoss() {
    const s = this.state,
      stage = this.config.stage,
      art = BOSS_ART[stage];
    const hp = STAGES[stage].hp * Math.min(2.5, 1 + (s.wave - 1) * 0.04);
    s.boss = {
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
      this.explode(m.x, m.y, `void-2-${this.config.stage}`, 150);
      s.miniBoss = null;
      s.enemyBullets = [];
      this.event("mini-destroyed", "TARGET DESTROYED");
    }
    if (!s.boss || s.boss.health > 0 || s.gameOver) return;
    this.explode(s.boss.x, s.boss.y, undefined, 210);
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
      (kind === "drone" && s.wingmen.level >= 3) ||
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
    const supplyTimes = [12, 28, 48, 72, 96];
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
          health: 60 + stage * 15,
          maxHealth: 60 + stage * 15,
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
    this.fire(step);
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
      });
    }
    const support = s.boss
      ? Math.max(
          6,
          11 -
            stage -
            (s.boss.phase ?? 1) * 0.7 -
            Math.max(0, (s.boss.age ?? 0) - 180) / 60,
        )
      : Math.max(2.4, 4.2 - stage * 0.3 - s.segment * 0.35);
    if (this.enemyClock >= (s.time < 3 ? 1.5 : support)) {
      this.enemyClock = 0;
      this.spawnFormation(!!s.boss);
    }
    for (const e of s.enemies) {
      e.flash = Math.max(0, (e.flash ?? 0) - step);
      e.stun = Math.max(0, (e.stun ?? 0) - step);
      if (e.stun > 0) continue;
      e.age = (e.age ?? 0) + step;
      const a = e.age,
        origin = e.originX ?? e.x;
      if (a > 5.5) {
        e.x += (origin < 195 ? -1 : 1) * 150 * step;
        e.y -= 90 * step;
      } else {
        if (e.motion === "turrets" && e.y > 95 && a < 6) e.y += 0;
        else
          e.y += (e.motion === "bombers" ? 135 : e.kind === 1 ? 82 : 60) * step;
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
      e.shot -= step;
      if (
        e.shot <= 0 &&
        e.y > 35 &&
        e.y < 460 &&
        !s.beams.length &&
        !(s.boss && (s.boss.restUntil ?? 0) > s.time)
      ) {
        e.shot = (e.kind === 2 ? 2.7 : 2.2) / (1 + stage * 0.15);
        if (e.kind === 2) this.ring(e.x, e.y + 18, 103, e.phase * 0.08);
        else
          this.fan(
            e.x,
            e.y + 14,
            s.segment === 0 ? 1 : 3,
            132,
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
        b.age < 1.8 &&
        s.ship.y + s.ship.radius >= 170 &&
        Math.abs(s.ship.x - b.x) < 22 + s.ship.radius
      )
        this.damage("beam");
    }
    s.beams = s.beams.filter((b) => b.age < 1.8);
    for (const r of s.rocks) {
      r.y += r.speed * step;
      r.phase += r.spin * step;
    }
    for (const b of s.bullets) {
      b.prevX = b.x;
      b.prevY = b.y;
      if (b.missile) {
        b.age = (b.age ?? 0) + step;
        const targets = [
          ...s.enemies.filter((e) => e.health > 0),
          ...(s.miniBoss ? [s.miniBoss] : []),
          ...(s.boss ? [s.boss] : []),
        ];
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
    s.rocks = s.rocks.filter((r) => r.y < 765).slice(-48);
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
        if (s.powers.overdrive > 0) this.laserBlockBudget += 4;
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
        for (const t of targets) {
          const damage =
            0.97 *
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
            t.health -= damage;
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
        for (const shot of weaponVolley(main, level)) {
          const angle = (shot.angle * Math.PI) / 180;
          s.bullets.push({
            x: s.ship.x + shot.offset,
            y: s.ship.y - 25,
            radius: 4,
            speed: Math.cos(angle) * 530,
            vx: Math.sin(angle) * 530,
            damage: shot.damage * 0.7,
            interceptor: s.powers.overdrive > 0,
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
          damage: 1.5,
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
        const targets = [
          ...s.enemies.filter((e) => e.health > 0),
          ...(s.miniBoss ? [s.miniBoss] : []),
          ...(s.boss ? [s.boss] : []),
        ].filter((e) => e.y < p.y);
        const target = targets.sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
        const angle = target
          ? clamp(Math.atan2(target.x - p.x, p.y - target.y), -0.26, 0.26)
          : 0;
        for (const offset of wingLevel === 3 ? [-4, 4] : [0])
          s.bullets.push({
            x: p.x + offset,
            y: p.y,
            radius: 3,
            speed: Math.cos(angle) * 500,
            vx: Math.sin(angle) * 500,
            damage: wingLevel === 1 ? 0.45 : wingLevel === 2 ? 0.5625 : 0.5,
            type: "pulse",
          });
      }
    }
  }
  private markHit(target: { flash?: number; flashAt?: number }) {
    if (this.state.time - (target.flashAt ?? -10) >= 0.1) {
      target.flash = 0.05;
      target.flashAt = this.state.time;
    }
  }
  private hitBoss(
    damage: number,
    x: number,
    y: number,
    radius = 0,
    laser = false,
  ) {
    const b = this.state.boss;
    if (!b) return;
    const hit = findBossHit(b, x, y, radius, laser);
    if (!hit) return;
    if (hit !== "core") {
      hit.health -= damage;
      this.markHit(hit);
      if (hit.health <= 0) {
        this.explode(b.x + hit.x, b.y + hit.y, undefined, 75);
        this.state.score += 125;
      }
    } else b.health -= damage;
    this.markHit(b);
    this.spark(x, laser ? (hit === "core" ? b.y : b.y + hit.y) : y);
  }
  private updateBoss(step: number) {
    const s = this.state,
      b = s.boss;
    if (!b) return;
    const stage = this.config.stage;
    b.age = (b.age ?? 0) + step;
    b.flash = Math.max(0, (b.flash ?? 0) - step);
    const phase =
      b.health <= b.maxHealth / 3
        ? 3
        : b.health <= (b.maxHealth * 2) / 3
          ? 2
          : 1;
    if (b.phase && b.phase !== phase) {
      s.enemyBullets = [];
      s.beams = [];
      b.shot = 1.5;
      this.beamClock = 2;
      this.stationary = 0;
      b.safeLaneX = clamp(s.ship.x + (phase === 2 ? -70 : 70), 65, 325);
      b.attackSerial = 0;
      b.restUntil = 0;
      this.event("phase", `PHASE ${phase}`);
      this.notice(`BOSS · PHASE ${phase}`, 0.9);
    }
    b.phase = phase;
    b.x = 195 + Math.sin(b.age * 0.42) * (stage === 2 ? 43 : 65);
    const mounts = (b.turrets ?? []).filter((t) => t.health > 0);
    for (const t of b.turrets ?? []) t.flash = Math.max(0, t.flash - step);
    this.beamClock -= step;
    if (Math.hypot(s.ship.x - this.anchor.x, s.ship.y - this.anchor.y) < 32)
      this.stationary += step;
    else {
      this.stationary = 0;
      this.anchor = { x: s.ship.x, y: s.ship.y };
    }
    if (
      phase === 3 &&
      this.stationary >= 1.8 &&
      this.beamClock <= 0 &&
      !s.beams.length &&
      ((b.restUntil ?? 0) > s.time || s.enemyBullets.length < 60)
    ) {
      s.enemyBullets = [];
      s.beams.push({ x: clamp(s.ship.x, 27, 363), y: s.ship.y, age: 0 });
      this.stationary = 0;
      this.beamClock = 3.4;
      this.event("warning", "ORBITAL LOCK");
    }
    b.shot -= step;
    if (b.shot <= 0 && !s.beams.length && (b.restUntil ?? 0) <= s.time) {
      b.shot = mounts.length
        ? (phase === 1 ? 1.6 : phase === 2 ? 1.45 : 1.25) / (1 + stage * 0.05)
        : 2.4;
      const beforeShots = s.enemyBullets.length;
      // Paired mounts alternate, reducing pressure when a hardpoint is destroyed.
      const parity = Math.floor(b.age * 2) % 2;
      const active = mounts.length
        ? (b.turrets ?? []).filter((t, i) => t.health > 0 && i % 2 === parity)
        : [{ x: 0, y: 45 }];
      b.attackSerial = (b.attackSerial ?? 0) + 1;
      const ringAttack = b.attackSerial % 3 === 0 && mounts.length > 0;
      if (ringAttack) {
        this.ring(b.x, b.y + 55, 90 + phase * 8, b.age * 0.07);
        b.shot = 2.8;
        b.restUntil = s.time + 1.8;
      }
      for (const t of ringAttack ? [] : active) {
        const x = b.x + t.x,
          y = b.y + t.y;
        const aim =
          phase >= 2
            ? Math.atan2(s.ship.x - x, Math.max(110, s.ship.y - y))
            : Math.sin(b.age * 0.65) * 0.3;
        this.fan(
          x,
          y,
          mounts.length ? (phase === 1 ? 5 : phase === 2 ? 7 : 9) : 3,
          phase === 1 ? 112 : 128,
          aim,
          0.15,
        );
      }
      if (s.enemyBullets.length === beforeShots) {
        for (const edge of [12, 378]) {
          const angle = Math.atan2(edge - b.x, 600 - b.y);
          this.pushPatternShot({
            x: b.x,
            y: b.y + 35,
            radius: 4,
            vx: Math.sin(angle) * 112,
            vy: Math.cos(angle) * 112,
          });
        }
      }
    }
  }
  private pushHostile(b: EnemyBullet) {
    if (this.state.enemyBullets.length < LIMITS.enemyBullets)
      this.state.enemyBullets.push(b);
  }
  private pushPatternShot(b: EnemyBullet) {
    const boss = this.state.boss;
    // Each authored volley reserves its phase's escape sector; raw admission never erases attacks.
    if (boss && threatensPassage(b, boss.safeLaneX ?? 265, 90)) return;
    this.pushHostile(b);
  }
  private interceptShots() {
    const s = this.state,
      spent = new Set<Bullet>(),
      removed = new Set<EnemyBullet>();
    if (this.laserBlockBudget > 0 && s.powers.overdrive > 0) {
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
      for (const r of s.rocks)
        if (!rocks.has(r) && collides(b, r)) {
          spent.add(b);
          rocks.add(r);
          s.score += r.target ? 25 : 10;
          this.explode(r.x, r.y, undefined, 65);
          if (this.random() < 0.2)
            s.pickups.push({
              x: r.x,
              y: r.y,
              age: 0,
              value: 0,
              kind: this.random() < 0.4 ? "repair" : "weapon",
            });
          break;
        }
      if (spent.has(b)) continue;
      const e = s.enemies.find((e) => e.health > 0 && collides(b, e));
      if (e) {
        spent.add(b);
        this.markHit(e);
        this.spark(b.x, b.y);
        e.health -=
          (b.damage ?? 1) *
          damageMultiplier(b.type ?? "pulse", e.kind === 2, e.kind === 0);
        if (e.health <= 0) this.kill(e);
      } else if (s.miniBoss && collides(b, s.miniBoss)) {
        spent.add(b);
        s.miniBoss.health -= b.damage ?? 1;
        this.markHit(s.miniBoss);
        this.spark(b.x, b.y);
      } else if (s.boss) {
        const boss = s.boss;
        if (findBossHit(boss, b.x, b.y, b.radius)) {
          spent.add(b);
          this.hitBoss(
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
          s.score += 2;
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
