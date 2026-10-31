export type DamageType = "pulse" | "plasma" | "laser" | "missile";
export type EquipmentId =
  "pulse" | "plasma" | "laser" | "missile" | "shield" | "drone";
export type Slot = "main" | "secondary" | "armor" | "wingman";
export interface EquipmentLoadout {
  main: EquipmentId;
  secondary: EquipmentId | null;
  armor: EquipmentId | null;
  wingman: EquipmentId | null;
}
export const EQUIPMENT: {
  id: EquipmentId;
  slot: Slot;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "pulse",
    slot: "main",
    name: "Pulse Cannon",
    description: "Focused kinetic fire. Reliable against every target.",
    icon: "pulse",
  },
  {
    id: "plasma",
    slot: "main",
    name: "Plasma Spread",
    description: "Wide volleys. +25% damage against armored targets.",
    icon: "plasma",
  },
  {
    id: "laser",
    slot: "main",
    name: "Arc Laser",
    description: "Continuous precision beam. Pierces up to 3 targets.",
    icon: "laser",
  },
  {
    id: "missile",
    slot: "secondary",
    name: "Seeker Missiles",
    description: "Retargeting missiles. +25% against small targets.",
    icon: "missile",
  },
  {
    id: "shield",
    slot: "armor",
    name: "Aegis Shield",
    description: "Absorbs one hit, then regenerates automatically.",
    icon: "shield",
  },
  {
    id: "drone",
    slot: "wingman",
    name: "Escort Wing",
    description: "Independent support fire. Drones have no collision.",
    icon: "drone",
  },
];
export const STAGES = [
  {
    name: "Asteroid Belt",
    boss: "Kla’ed Siegebreaker",
    weakness: "plasma" as DamageType,
    description: "Break the blockade through an ancient debris field.",
    color: "#60d8ff",
    hp: 900,
  },
  {
    name: "Orbital Convoy",
    boss: "Nairan Interdictor",
    weakness: "laser" as DamageType,
    description: "Intercept the convoy. Watch for reactor beam warnings.",
    color: "#b5a2ff",
    hp: 1200,
  },
  {
    name: "Citadel Assault",
    boss: "Command Dreadnought",
    weakness: "missile" as DamageType,
    description: "Breach the citadel and defeat its command fleet.",
    color: "#f0bc74",
    hp: 1500,
  },
];
export interface RunConfig {
  seed?: number;
  mode: "stage" | "endless";
  stage: number;
  equipment: EquipmentLoadout;
  levels: Record<EquipmentId, number>;
  powerups: boolean;
}
export const defaultEquipment = (): EquipmentLoadout => ({
  main: "pulse",
  secondary: null,
  armor: null,
  wingman: null,
});
export const defaultLevels = (): Record<EquipmentId, number> => ({
  pulse: 1,
  plasma: 1,
  laser: 0,
  missile: 0,
  shield: 0,
  drone: 0,
});
export const defaultRun = (): RunConfig => ({
  mode: "stage",
  stage: 0,
  equipment: defaultEquipment(),
  levels: defaultLevels(),
  powerups: false,
});
export function damageMultiplier(
  type: DamageType,
  armored = false,
  small = false,
  weakness?: DamageType,
) {
  return type === weakness ||
    (type === "plasma" && armored) ||
    (type === "missile" && small)
    ? 1.25
    : 1;
}
export function weaponVolley(type: EquipmentId, level: number) {
  const l = Math.max(1, Math.min(3, level));
  const count = type === "plasma" ? l * 2 + 1 : l;
  const total = (type === "plasma" ? 1.5 : 1) * [1, 1.6, 2.3][l - 1];
  return Array.from({ length: count }, (_, i) => ({
    angle:
      type === "plasma"
        ? (i - (count - 1) / 2) * ((8 + (l - 1) * 2) / ((count - 1) / 2))
        : 0,
    offset: type === "plasma" ? 0 : (i - (count - 1) / 2) * 11,
    damage: total / count,
  }));
}
export function equipmentStat(id: EquipmentId, level: number) {
  if (id === "shield")
    return `1 hit · ${[15, 12, 10][Math.max(0, level - 1)]}s recovery`;
  if (id === "drone")
    return `${level === 1 ? "1 drone" : level === 2 ? "2 drones" : "2 twin-gun drones"} · ${100 + (level - 1) * 20}% firepower`;
  if (id === "missile")
    return `${level} seeker${level > 1 ? "s" : ""} · ${100 + (level - 1) * 20}% damage`;
  if (id === "laser")
    return `${6 + (level - 1) * 4}px beam · 3 targets · ${100 + (level - 1) * 20}% damage`;
  return `${weaponVolley(id, level).length} shots · ${100 + (level - 1) * 20}% volley damage`;
}
