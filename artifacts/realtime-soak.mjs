// src/stage-waves.ts
var STAGE_DEFINITION = {
  duration: 90,
  waves: [
    { start: 0, end: 15, name: "WARM-UP", theme: "blue" },
    { start: 15, end: 35, name: "ELITE AMBUSH", theme: "violet" },
    { start: 35, end: 60, name: "MINI-BOSS RUSH", theme: "amber" },
    { start: 60, end: 90, name: "FINAL BOSS", theme: "red" }
  ]
};
var timeline = [
  ...STAGE_DEFINITION.waves.map((w, wave) => ({
    id: `wave-${wave}`,
    at: w.start,
    kind: "wave",
    wave
  })),
  { id: "meteor-1", at: 8, kind: "meteors" },
  { id: "storm-1", at: 20, kind: "storm" },
  { id: "mini-warning", at: 35, kind: "mini-warning" },
  { id: "mini-spawn", at: 36.5, kind: "mini-spawn" },
  { id: "meteor-2", at: 47, kind: "meteors" },
  { id: "boss-warning", at: 58.5, kind: "boss-warning" },
  { id: "boss-spawn", at: 60, kind: "boss-spawn" }
].sort((a, b) => a.at - b.at);
var StageWaveManager = class {
  cursor = 0;
  reset() {
    this.cursor = 0;
  }
  advance(time) {
    const events = [];
    while (this.cursor < timeline.length && timeline[this.cursor].at <= time)
      events.push(timeline[this.cursor++]);
    return events;
  }
};
function waveAt(time) {
  return time >= 60 ? 3 : time >= 35 ? 2 : time >= 15 ? 1 : 0;
}

// src/equipment.ts
var STAGES = [
  {
    name: "Asteroid Belt",
    boss: "Armored Carrier",
    weakness: "plasma",
    description: "Break the blockade through an ancient debris field.",
    color: "#60d8ff",
    hp: 70
  },
  {
    name: "Orbital Convoy",
    boss: "Reactor Frigate",
    weakness: "laser",
    description: "Intercept the convoy. Watch for reactor beam warnings.",
    color: "#b5a2ff",
    hp: 95
  },
  {
    name: "Citadel Assault",
    boss: "Command Dreadnought",
    weakness: "missile",
    description: "Breach the citadel and defeat its command fleet.",
    color: "#f0bc74",
    hp: 120
  }
];
var defaultEquipment = () => ({
  main: "pulse",
  secondary: null,
  armor: null,
  wingman: null
});
var defaultLevels = () => ({
  pulse: 1,
  plasma: 1,
  laser: 0,
  missile: 0,
  shield: 0,
  drone: 0
});
var defaultRun = () => ({
  mode: "stage",
  stage: 0,
  equipment: defaultEquipment(),
  levels: defaultLevels(),
  powerups: false
});
function damageMultiplier(type, armored = false, small = false, weakness) {
  return type === weakness || type === "plasma" && armored || type === "missile" && small ? 1.25 : 1;
}
function weaponVolley(type, level) {
  const l = Math.max(1, Math.min(3, level));
  const count = type === "plasma" ? l * 2 + 1 : l;
  const total = (type === "plasma" ? 1.5 : 1) * (1 + (l - 1) * 0.2);
  return Array.from({ length: count }, (_, i) => ({
    angle: type === "plasma" ? (i - (count - 1) / 2) * (l === 1 ? 12 : 6) : 0,
    offset: type === "plasma" ? 0 : (i - (count - 1) / 2) * 11,
    damage: total / count
  }));
}

// src/model.ts
var WORLD = { width: 390, height: 693.3333333333, margin: 23 };
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var collides = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.radius + b.radius) ** 2;
function clampShip(x, y) {
  return {
    x: clamp(x, WORLD.margin, WORLD.width - WORLD.margin),
    y: clamp(y, 100, WORLD.height - 35)
  };
}
var GameModel = class {
  constructor(random = Math.random) {
    this.random = random;
    this.state = this.initialState();
  }
  random;
  fireCount = 0;
  state;
  practice = false;
  weapon = "straight";
  config = defaultRun();
  spawnClock = 0;
  enemyClock = 0;
  shotClock = 0;
  actionLock = 0;
  missileClock = 0;
  droneClock = 0;
  beamClock = 4;
  perkAt = 20;
  waveAt = 30;
  bossAt = 90;
  velocity = { x: 0, y: 0 };
  killsSinceDrop = 0;
  director = new StageWaveManager();
  cycleStart = 0;
  eventId = 0;
  events = [];
  drainEvents() {
    return this.events.splice(0);
  }
  notice(text, duration = 1.5) {
    this.state.warning = text;
    this.state.warningUntil = this.state.time + duration;
    this.events.push({ id: ++this.eventId, type: "warning", text });
  }
  configure(config2) {
    this.config = structuredClone(config2);
    this.weapon = config2.equipment.main === "plasma" ? "spread" : "straight";
  }
  initialState() {
    return {
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
      gameOver: false,
      invincible: 0,
      result: null,
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
      powers: { weapon: 0, missile: 0, drone: 0 },
      pickupCount: 0,
      explosions: [],
      beams: [],
      laser: 0
    };
  }
  reset() {
    this.fireCount = 0;
    this.killsSinceDrop = 0;
    this.director.reset();
    this.cycleStart = 0;
    this.events = [];
    this.eventId = 0;
    this.state = this.initialState();
    this.spawnClock = this.enemyClock = this.shotClock = this.actionLock = this.missileClock = this.droneClock = 0;
    this.beamClock = 4;
    this.perkAt = 20;
    this.waveAt = 30;
    this.bossAt = 90;
    this.clearInput();
  }
  clearInput() {
    this.velocity = { x: 0, y: 0 };
  }
  fillEnergy() {
    if (this.practice && !this.state.gameOver) this.state.energy = 100;
  }
  withdraw() {
    this.finish("withdrawn");
  }
  action(action) {
    const s = this.state;
    if (s.gameOver || s.powerChoices.length)
      return { accepted: false, reason: "Start or resume a mission first." };
    if (this.actionLock > 0)
      return { accepted: false, reason: "Wait for the previous maneuver." };
    if (action === "emp") {
      if (s.energy < 100)
        return {
          accepted: false,
          reason: `EMP charging (${Math.floor(s.energy)}%)`
        };
      s.energy = 0;
      s.emps++;
      s.enemyBullets = [];
      s.beams = [];
      s.empEffect = 0.75;
      s.empOrigin = { ...s.ship };
      s.score += s.rocks.reduce((sum, r) => sum + (r.target ? 25 : 10), 0);
      s.rocks = [];
      for (const e of s.enemies) this.kill(e);
      s.enemies = [];
      if (s.boss) s.boss.health = Math.max(0, s.boss.health - 18);
      if (s.miniBoss) s.miniBoss.health = Math.max(0, s.miniBoss.health - 18);
      this.actionLock = 0.25;
      this.clearInput();
      this.checkBoss();
      return { accepted: true, reason: "EMP deployed. Hostile fire cleared." };
    }
    if (s.dodgeCooldown > 0)
      return {
        accepted: false,
        reason: `Dodge recharging: ${s.dodgeCooldown.toFixed(1)}s`
      };
    s.warpOrigin = { x: s.ship.x, y: s.ship.y };
    s.dodgeCooldown = 2.5;
    s.ship.x = clampShip(
      s.ship.x + (action === "dodgeLeft" ? -130 : 130),
      s.ship.y
    ).x;
    s.dodgeTime = 0.6;
    s.invincible = Math.max(s.invincible, 0.6);
    s.dodgeDirection = action === "dodgeLeft" ? -1 : 1;
    s.dodges++;
    this.actionLock = 0.2;
    this.clearInput();
    return {
      accepted: true,
      reason: action === "dodgeLeft" ? "Dodge left" : "Dodge right"
    };
  }
  finish(result) {
    this.state.result = this.practice ? "practice" : result;
    this.state.gameOver = true;
    this.clearInput();
  }
  drop(x, y, value, art) {
    const s = this.state;
    s.pickups.push({ x, y, value, age: 0 });
    s.explosions.push({ x, y, age: 0, art });
  }
  kill(e) {
    const s = this.state;
    s.score += 40;
    s.combo++;
    s.energy = Math.min(100, s.energy + 5);
    this.drop(e.x, e.y, 0, `void-1-${e.kind ?? 0}`);
    this.killsSinceDrop++;
    if (e.kind === 2 || this.killsSinceDrop >= 5 || this.random() < 0.3) {
      const kinds = s.lives === 1 ? [
        "weapon",
        "missile",
        "drone",
        "shield",
        "repair",
        "repair",
        "repair",
        "energy"
      ] : ["weapon", "missile", "drone", "shield", "repair", "energy"];
      s.pickups.push({
        x: e.x,
        y: e.y,
        value: 0,
        age: 0,
        kind: kinds[Math.floor(this.random() * kinds.length) % kinds.length]
      });
      this.killsSinceDrop = 0;
    }
  }
  checkBoss() {
    const s = this.state;
    if (s.miniBoss && s.miniBoss.health <= 0) {
      const m2 = s.miniBoss;
      s.score += 200;
      for (const [i, kind] of ["weapon", s.lives < 3 ? "repair" : "energy"].entries())
        s.pickups.push({ x: m2.x + i * 25, y: m2.y, age: 0, value: 0, kind });
      this.drop(m2.x, m2.y, 0, "void-2-3");
      s.miniBoss = null;
      s.enemyBullets = [];
      this.events.push({
        id: ++this.eventId,
        type: "mini-destroyed",
        text: "TARGET DESTROYED"
      });
    }
    if (!s.boss || s.boss.health > 0 || s.gameOver) return;
    s.score += 500;
    s.credits += 30;
    this.drop(s.boss.x, s.boss.y, 0);
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
    } else this.finish("won");
  }
  damage() {
    const s = this.state;
    if (s.invincible > 0) return;
    s.hitEffect = 0.3;
    s.damageKind = s.shield ? "shield" : "hull";
    s.invincible = 1.2;
    s.combo = 0;
    if (s.shield) {
      s.shield = false;
      s.shieldTimer = [15, 12, 10][Math.max(0, this.config.levels.shield - 1)];
      return;
    }
    if (!this.practice) {
      s.lives--;
      if (s.lives <= 0) this.finish("lost");
    }
  }
  fan(x, y, count, speed, offset = 0) {
    const s = this.state;
    speed *= Math.min(1.4, 1 + (s.wave - 1) * 0.04);
    for (let i = 0; i < count && s.enemyBullets.length < 280; i++) {
      const angle = offset + (i - (count - 1) / 2) * 0.25;
      s.enemyBullets.push({
        x,
        y,
        radius: 5,
        vx: Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed
      });
    }
  }
  ring(x, y, speed, stage) {
    const gap = Math.PI / 2 + (stage - 1) * 0.35;
    for (let i = 0; i < 16 && this.state.enemyBullets.length < 280; i++) {
      const angle = i * Math.PI * 2 / 16;
      if (Math.abs(Math.atan2(Math.sin(angle - gap), Math.cos(angle - gap))) < 0.55)
        continue;
      this.state.enemyBullets.push({
        x,
        y,
        radius: 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      });
    }
  }
  offerPower() {
    const pool = ["damage", "rapid", "magnet", "charger", "evasive"].filter(
      (id) => (this.state.perks[id] || 0) < 2
    );
    pool.push("repair", "energy", "credits");
    const choices = [];
    while (choices.length < 3)
      choices.push(
        pool.splice(
          Math.min(pool.length - 1, Math.floor(this.random() * pool.length)),
          1
        )[0]
      );
    this.state.powerChoices = choices;
    this.clearInput();
  }
  choosePower(id) {
    const s = this.state;
    if (!s.powerChoices.includes(id)) return false;
    s.powerChoices = [];
    if (id === "repair") {
      if (s.lives < 3) s.lives++;
      else s.energy = Math.min(100, s.energy + 30);
    } else if (id === "energy") s.energy = 100;
    else if (id === "credits") s.credits += 20;
    else s.perks[id] = (s.perks[id] || 0) + 1;
    this.clearInput();
    return true;
  }
  update(dt, axes, target = null) {
    const s = this.state;
    if (s.gameOver || s.powerChoices.length) return;
    const step = clamp(dt, 0, 0.05);
    if (!step) return;
    const endless = this.config.mode === "endless", stage = this.config.stage, local = endless ? s.time - this.cycleStart : s.time;
    s.time = endless ? s.time + step : Math.min(90, s.time + step);
    if (this.config.powerups && !endless && s.time >= this.perkAt && this.perkAt <= 40) {
      this.perkAt += 20;
      this.offerPower();
      return;
    }
    if (endless && !s.boss && s.time >= this.waveAt && s.time < this.bossAt) {
      s.wave++;
      this.waveAt += 30;
      return;
    }
    const elapsed = endless ? s.time - this.cycleStart : s.time;
    s.segment = waveAt(elapsed);
    for (const event of this.director.advance(elapsed)) {
      if (event.kind === "mini-warning")
        this.notice("WARNING \xB7 ELITE COMMANDER");
      if (event.kind === "boss-warning" && !endless)
        this.notice("WARNING \xB7 CAPITAL SHIP");
      if (event.kind === "mini-spawn")
        s.miniBoss = {
          x: 195,
          y: 150,
          radius: 32,
          health: 18 + stage * 6,
          maxHealth: 18 + stage * 6,
          shot: 1.5
        };
      if (event.kind === "storm") {
        s.storm = { x: 45 + stage * 60, width: 130, age: 0 };
        this.notice("MAGNETIC STORM \xB7 AVOID THE FIELD", 1.2);
      }
      if (event.kind === "meteors") {
        s.meteors = {
          safeX: 65 + (stage + (event.at > 40 ? 1 : 0)) % 3 * 130,
          age: 0,
          spawned: false
        };
        this.notice("METEOR SHOWER \xB7 WATCH THE LANES", 1);
      }
      if (event.kind === "boss-spawn" && s.miniBoss) {
        s.miniBoss = null;
        this.notice("TARGET ESCAPED", 1.5);
      }
    }
    if (s.warningUntil <= s.time) s.warning = "";
    if (s.storm) {
      s.storm.age += step;
      if (s.storm.age >= 5.2) s.storm = null;
    }
    if (s.meteors) {
      const hazard = s.meteors;
      hazard.age += step;
      if (hazard.age >= 1 && !hazard.spawned) {
        hazard.spawned = true;
        for (let x = 35; x < 390; x += 64)
          if (Math.abs(x - hazard.safeX) > 65)
            s.rocks.push({
              x,
              y: -30,
              radius: 18,
              speed: 130,
              spin: 1,
              phase: 0,
              target: true
            });
      }
      if (hazard.age >= 5) s.meteors = null;
    }
    s.energy = Math.min(100, s.energy + step * (5 + (s.perks.charger || 0)));
    s.powers.missile = Math.max(0, s.powers.missile - step);
    s.powers.drone = Math.max(0, s.powers.drone - step);
    for (const key of [
      "invincible",
      "dodgeCooldown",
      "dodgeTime",
      "empEffect",
      "hitEffect",
      "shieldTimer",
      "laser"
    ])
      s[key] = Math.max(0, s[key] - step);
    this.actionLock = Math.max(0, this.actionLock - step);
    s.explosions.forEach((e) => e.age += step);
    s.explosions = s.explosions.filter((e) => e.age < 0.5).slice(-40);
    for (const p of s.pickups) {
      p.age += step;
      const dx = s.ship.x - p.x, dy = s.ship.y - p.y, d = Math.hypot(dx, dy);
      if (d < 150 + (s.perks.magnet || 0) * 40) {
        const attraction = 1 - Math.exp(-step * 7);
        p.x += dx * attraction;
        p.y += dy * attraction;
      } else p.y += 35 * step;
      if (d < 16) {
        if (p.kind) {
          s.pickupCount++;
          const effect = p.kind === "repair" && s.lives >= 3 || p.kind === "weapon" && s.powers.weapon >= 2 ? "energy" : p.kind;
          this.events.push({
            id: ++this.eventId,
            type: "pickup",
            data: { kind: p.kind, effect }
          });
          if (p.kind === "weapon") {
            if (s.powers.weapon < 2) s.powers.weapon++;
            else s.energy = Math.min(100, s.energy + 25);
          } else if (p.kind === "missile" || p.kind === "drone")
            s.powers[p.kind] = Math.min(24, s.powers[p.kind] + 12);
          else if (p.kind === "shield") s.shield = true;
          else if (p.kind === "repair" && s.lives < 3) s.lives++;
          else s.energy = Math.min(100, s.energy + 25);
        }
        p.age = 20;
      }
    }
    s.pickups = s.pickups.filter((p) => p.age < 15 && p.y < 730).slice(-60);
    for (const b of s.beams) {
      b.age += step;
      if (b.age >= 1.2 && b.age < 1.65 && s.ship.y + s.ship.radius >= 170 && Math.abs(s.ship.x - b.x) < 17)
        this.damage();
    }
    s.beams = s.beams.filter((b) => b.age < 1.65);
    const desired = target ? {
      x: clamp((target.x - s.ship.x) * 10, -310, 310),
      y: clamp((target.y - s.ship.y) * 10, -310, 310)
    } : { x: clamp(axes.x, -1, 1) * 310, y: clamp(axes.y, -1, 1) * 310 };
    const slowed = s.storm && s.storm.age >= 1.2 && s.ship.x >= s.storm.x && s.ship.x <= s.storm.x + s.storm.width;
    if (slowed) {
      desired.x *= 0.7;
      desired.y *= 0.7;
    }
    const blend = 1 - Math.exp(-step / 0.055);
    this.velocity.x += (desired.x - this.velocity.x) * blend;
    this.velocity.y += (desired.y - this.velocity.y) * blend;
    const next = clampShip(
      s.ship.x + this.velocity.x * step,
      s.ship.y + this.velocity.y * step
    );
    if (next.x === WORLD.margin || next.x === WORLD.width - WORLD.margin)
      this.velocity.x = 0;
    if (next.y === 100 || next.y === WORLD.height - 35) this.velocity.y = 0;
    Object.assign(s.ship, next);
    const main = this.config.equipment.main === "laser" ? "laser" : this.weapon === "spread" ? "plasma" : "pulse", level = 1 + s.powers.weapon, boost = 1 + (s.perks.damage || 0) * 0.1;
    this.shotClock += step;
    const interval = (main === "plasma" ? 0.108 : main === "laser" ? 0.1 : 0.072) / (1 + (s.perks.rapid || 0) * 0.1);
    if (this.shotClock >= interval) {
      this.fireCount++;
      this.shotClock -= interval;
      if (main === "laser") {
        s.laser = 0.12;
        const targets = [
          ...s.enemies.filter(
            (e) => e.health > 0 && e.y < s.ship.y && Math.abs(e.x - s.ship.x) < e.radius + 3 + level * 2 + s.powers.weapon * 14
          ),
          ...s.miniBoss && s.miniBoss.y < s.ship.y && Math.abs(s.miniBoss.x - s.ship.x) < s.miniBoss.radius + 8 + s.powers.weapon * 14 ? [s.miniBoss] : [],
          ...s.boss && s.boss.y < s.ship.y && Math.abs(s.boss.x - s.ship.x) < s.boss.radius + 3 + level * 2 + s.powers.weapon * 14 ? [s.boss] : []
        ].sort((a, b) => b.y - a.y).slice(0, 3);
        for (const t of targets) {
          t.health -= 0.45 * (1 + (level - 1) * 0.2) * boost * damageMultiplier(
            "laser",
            false,
            false,
            t === s.boss ? STAGES[stage].weakness : void 0
          );
          if (t !== s.boss && t !== s.miniBoss && t.health <= 0)
            this.kill(t);
        }
      } else
        for (const shot of weaponVolley(main, level)) {
          const angle = shot.angle * Math.PI / 180;
          s.bullets.push({
            x: s.ship.x + shot.offset,
            y: s.ship.y - 25,
            radius: 4,
            speed: Math.cos(angle) * 530,
            vx: Math.sin(angle) * 530,
            damage: shot.damage * boost * 0.56,
            type: main
          });
        }
    }
    this.missileClock += step;
    this.droneClock += step;
    if (s.powers.missile > 0 && this.missileClock >= 2) {
      this.missileClock = 0;
      const l = Math.max(1, this.config.levels.missile);
      for (let i = 0; i < l; i++)
        s.bullets.push({
          x: s.ship.x + (i - (l - 1) / 2) * 16,
          y: s.ship.y - 10,
          radius: 5,
          speed: 260,
          vx: 0,
          damage: 2 * (1 + (l - 1) * 0.2) / l,
          type: "missile",
          missile: true,
          age: 0
        });
    }
    if (s.powers.drone > 0 && this.droneClock >= 0.8) {
      this.droneClock = 0;
      const l = Math.max(1, this.config.levels.drone), n = l === 1 ? 1 : l === 2 ? 2 : 4;
      for (let i = 0; i < n; i++)
        s.bullets.push({
          x: s.ship.x + (i % 2 === 0 ? -44 : 44) + (i >= 2 ? 8 : 0),
          y: s.ship.y + 8,
          radius: 3,
          speed: 500,
          vx: 0,
          damage: 0.8 * (1 + (l - 1) * 0.2) / n,
          type: "pulse"
        });
    }
    this.spawnClock += step;
    this.enemyClock += step;
    if (!s.boss && (endless || s.time < 60) && this.spawnClock >= (local < 15 ? 1.6 : 2.1)) {
      this.spawnClock = 0;
      const radius = 14 + this.random() * 14;
      s.rocks.push({
        x: 30 + this.random() * 330,
        y: -40,
        radius,
        speed: 95 + this.random() * 70,
        spin: (this.random() - 0.5) * 1.8,
        phase: 0,
        target: this.random() > 0.68
      });
    }
    if (!s.boss && (endless || s.time < 60) && this.enemyClock >= (local < 15 ? 2.3 : 1.85)) {
      this.enemyClock = 0;
      const kind = s.segment === 1 ? 2 : Math.floor(this.random() * (s.segment === 0 ? 2 : 3)), center = 65 + this.random() * 260;
      for (let i = 0; i < 3 && s.enemies.length < 24; i++)
        s.enemies.push({
          x: clamp(center + (i - 1) * 55, 30, 360),
          y: -30 - (Math.floor(s.time / 3) % 2 === 0 ? Math.abs(i - 1) * 30 : 0),
          radius: kind === 2 ? 22 : 16,
          health: (kind === 2 ? 4 : 2) * (1 + stage * 0.2 + (s.wave - 1) * 0.08),
          shot: 1.5 + i * 0.25,
          phase: this.random() * 6,
          kind: stage === 2 && i === 1 ? 2 : kind
        });
      if (stage === 1) {
        const formation = s.enemies.slice(-3);
        formation.forEach((e, i) => {
          e.y = -30 - i * 35;
          e.phase = i * 0.8;
        });
      }
    }
    if (s.boss && stage === 2 && this.enemyClock >= 6) {
      this.enemyClock = 0;
      for (const x of [40, 350])
        if (s.enemies.length < 24)
          s.enemies.push({
            x,
            y: -30,
            radius: 16,
            health: 2,
            shot: 1.2,
            phase: 0,
            kind: 0
          });
    }
    if ((endless ? s.time >= this.bossAt : s.time >= 60) && !s.boss) {
      const hp = STAGES[stage].hp * (1 + (s.wave - 1) * 0.08);
      s.boss = {
        x: 195,
        y: 140,
        radius: 48,
        health: hp,
        maxHealth: hp,
        shot: 1.5
      };
      s.rocks = [];
      s.enemies = [];
      s.enemyBullets = [];
    }
    for (const b of s.bullets) {
      if (b.missile) {
        b.age = (b.age || 0) + step;
        const ts = [
          ...s.enemies.filter((e) => e.health > 0),
          ...s.boss ? [s.boss] : [],
          ...s.miniBoss ? [s.miniBoss] : []
        ];
        const t = ts.sort(
          (a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y)
        )[0];
        if (t) {
          const d = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          b.vx = (b.vx || 0) + ((t.x - b.x) / d * 320 - (b.vx || 0)) * Math.min(1, step * 6);
          b.speed += (-(t.y - b.y) / d * 320 - b.speed) * Math.min(1, step * 6);
        }
      }
      b.y -= b.speed * step;
      b.x += (b.vx || 0) * step;
    }
    for (const r of s.rocks) {
      r.y += r.speed * step;
      r.phase += r.spin * step;
    }
    for (const e of s.enemies) {
      e.flash = Math.max(0, (e.flash || 0) - step);
      e.y += (e.kind === 1 ? 75 : 55) * step;
      e.x = clamp(
        e.x + Math.sin(s.time * 1.5 + e.phase) * (stage > 0 ? 35 : 22) * step,
        25,
        365
      );
      e.shot -= step;
      if (s.time >= 15 && e.shot <= 0 && e.y > 30 && e.y < 400) {
        e.shot = 2.1;
        if (e.kind === 2) this.ring(e.x, e.y + 15, 115, stage);
        else this.fan(e.x, e.y + 15, local < 35 ? 1 : 3, 140);
      }
    }
    if (s.miniBoss) {
      const m2 = s.miniBoss;
      m2.x = 195 + Math.sin(s.time * 1.3) * 110;
      m2.shot -= step;
      if (m2.shot <= 0) {
        m2.shot = 1.7;
        this.ring(m2.x, m2.y + 25, 115, stage);
      }
    }
    if (s.boss) {
      const b = s.boss, phase = b.health <= b.maxHealth / 3 ? 3 : b.health <= b.maxHealth * 2 / 3 ? 2 : 1;
      if (b.phase && b.phase !== phase) {
        s.enemyBullets = [];
        s.beams = [];
        b.shot = 1.2;
        this.beamClock = 2;
        this.events.push({
          id: ++this.eventId,
          type: "phase",
          text: `PHASE ${phase}`
        });
        this.notice(`BOSS \xB7 PHASE ${phase}`, 0.8);
      }
      b.phase = phase;
      this.beamClock -= step;
      if (phase === 3 && this.beamClock <= 0) {
        this.beamClock = 3.5;
        s.beams.push({ x: clamp(s.ship.x, 40, 350), age: 0 });
        if (stage === 2 && phase === 3)
          s.beams.push({ x: clamp(390 - s.ship.x, 40, 350), age: 0 });
      }
      b.x = 195 + Math.sin((s.time - 60) * 0.65) * 90;
      b.shot -= step;
      if (b.shot <= 0) {
        b.shot = phase === 2 ? 0.9 : 1.2;
        const aimed = phase >= 2 && Math.floor(s.time / 3) % 2 === 1;
        this.fan(
          b.x,
          b.y + 35,
          aimed ? 3 : 5,
          aimed ? 170 : 145,
          aimed ? Math.atan2(s.ship.x - b.x, Math.max(50, s.ship.y - b.y)) : 0
        );
      }
    }
    for (const b of s.enemyBullets) {
      b.x += b.vx * step;
      b.y += b.vy * step;
    }
    const spent = /* @__PURE__ */ new Set(), rocks = /* @__PURE__ */ new Set();
    for (const b of s.bullets) {
      for (const r of s.rocks)
        if (!rocks.has(r) && collides(b, r)) {
          spent.add(b);
          rocks.add(r);
          s.score += r.target ? 25 : 10;
          s.energy = Math.min(100, s.energy + 2);
          this.drop(r.x, r.y, 0);
          if (this.random() < 0.2)
            s.pickups.push({
              x: r.x,
              y: r.y,
              age: 0,
              value: 0,
              kind: this.random() < 0.4 ? "repair" : "weapon"
            });
          break;
        }
      if (spent.has(b)) continue;
      const e = s.enemies.find((e2) => e2.health > 0 && collides(b, e2));
      if (e) {
        spent.add(b);
        e.flash = 0.07;
        s.explosions.push({ x: b.x, y: b.y, age: 0.3 });
        e.health -= (b.damage ?? 1) * damageMultiplier(b.type || "pulse", e.kind === 2, e.kind === 0);
        if (e.health <= 0) this.kill(e);
      } else if (s.miniBoss && collides(b, s.miniBoss)) {
        spent.add(b);
        s.miniBoss.health -= b.damage ?? 1;
      } else if (s.boss && collides(b, s.boss)) {
        spent.add(b);
        s.boss.health -= (b.damage ?? 1) * damageMultiplier(
          b.type || "pulse",
          false,
          false,
          STAGES[stage].weakness
        );
        s.score += 2;
      }
    }
    for (const r of s.rocks)
      if (!rocks.has(r) && collides(s.ship, r)) {
        rocks.add(r);
        this.damage();
      }
    for (const e of s.enemies)
      if (e.health > 0 && collides(s.ship, e)) {
        e.health = 0;
        this.damage();
      }
    s.enemyBullets = s.enemyBullets.filter((b) => {
      if (collides(s.ship, b)) {
        this.damage();
        return false;
      }
      return b.y < 750 && b.y > -40 && b.x > -30 && b.x < 420;
    });
    if (s.boss && collides(s.ship, s.boss)) this.damage();
    if (s.miniBoss && collides(s.ship, s.miniBoss)) this.damage();
    s.bullets = s.bullets.slice(-360).filter(
      (b) => b.y > -30 && b.y < 750 && b.x > -30 && b.x < 420 && (b.age || 0) < 5 && !spent.has(b)
    );
    s.rocks = s.rocks.filter((r) => r.y < 765 && !rocks.has(r));
    s.enemies = s.enemies.filter((e) => e.health > 0 && e.y < 765);
    this.checkBoss();
    if (this.events.length > 64) this.events = this.events.slice(-64);
    if (!endless && s.time >= 90 && !s.gameOver) this.finish("timeout");
  }
};

// qa/realtime-soak.ts
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
var m = new GameModel();
var config = defaultRun();
config.mode = "endless";
m.configure(config);
m.practice = true;
var started = performance.now();
var samples = [];
var previous = started;
var accumulated = 0;
var ticks = 0;
var nextSample = 0;
var maxObjects = 0;
var maxStepMs = 0;
var timer = setInterval(() => {
  const now = performance.now();
  accumulated += (now - previous) / 1e3;
  previous = now;
  while (accumulated >= 1 / 60) {
    const before = performance.now();
    if (m.state.energy >= 100) m.action("emp");
    const t = m.state.boss || m.state.miniBoss || m.state.pickups.find((p) => p.kind) || { x: 195, y: 600 };
    m.update(1 / 60, { x: Math.max(-1, Math.min(1, (t.x - m.state.ship.x) / 30)), y: 0 });
    m.drainEvents();
    maxStepMs = Math.max(maxStepMs, performance.now() - before);
    ticks++;
    accumulated -= 1 / 60;
    const s = m.state;
    if (s.bullets.length > 360 || s.enemyBullets.length > 280 || s.enemies.length > 24) throw new Error("Object cap exceeded");
    maxObjects = Math.max(maxObjects, s.bullets.length + s.enemyBullets.length + s.enemies.length + s.rocks.length + s.pickups.length + s.explosions.length);
  }
  const seconds = (now - started) / 1e3;
  if (seconds >= nextSample || seconds >= 1200) {
    const sample = { wallSeconds: +seconds.toFixed(2), simulationSeconds: +m.state.time.toFixed(2), wave: m.state.wave, heapMB: +(process.memoryUsage().heapUsed / 1048576).toFixed(2), maxObjects, maxStepMs: +maxStepMs.toFixed(3), ticks };
    samples.push(sample);
    console.log(JSON.stringify(sample));
    nextSample += 60;
    writeFileSync("artifacts/realtime-model-soak.json", JSON.stringify({ kind: "Real wall-clock 20-minute model soak; rendering and physical controls excluded", complete: seconds >= 1200, samples }, null, 2));
  }
  if (seconds >= 1200) {
    clearInterval(timer);
    console.log("REALTIME MODEL SOAK COMPLETE");
  }
}, 16);
