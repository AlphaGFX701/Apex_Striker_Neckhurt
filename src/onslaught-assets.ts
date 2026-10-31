/** Artist-derived sprite contract. Mount coordinates are relative to image center,
 * expressed in source-width units so the simulation can share the renderer scale. */
export const BOSS_ART = [
  {
    key: "boss-0",
    width: 176,
    sourceWidth: 208,
    sourceHeight: 240,
    mounts: [
      { x: -64 / 208, y: 40 / 208 },
      { x: 64 / 208, y: 40 / 208 },
    ],
  },
  {
    key: "boss-1",
    width: 215,
    sourceWidth: 208,
    sourceHeight: 240,
    mounts: [
      { x: -75 / 208, y: 24 / 208 },
      { x: 75 / 208, y: 24 / 208 },
      { x: -48 / 208, y: 72 / 208 },
      { x: 48 / 208, y: 72 / 208 },
    ],
  },
  {
    key: "boss-2",
    width: 254,
    sourceWidth: 240,
    sourceHeight: 264,
    mounts: [
      { x: -96 / 240, y: 12 / 240 },
      { x: 96 / 240, y: 12 / 240 },
      { x: -96 / 240, y: 58 / 240 },
      { x: 96 / 240, y: 58 / 240 },
      { x: -24 / 240, y: 90 / 240 },
      { x: 24 / 240, y: 90 / 240 },
    ],
  },
] as const;

export const PICKUP_ART = [
  "weapon",
  "missile",
  "drone",
  "shield",
  "repair",
  "energy",
] as const;
export const ONSLAUGHT_IMAGES = [
  "red-shot",
  ...BOSS_ART.flatMap((boss, stage) => [
    boss.key,
    `${boss.key}-hit`,
    `turret-${stage}`,
    `turret-${stage}-hit`,
    ...Array.from({ length: 8 }, (_, frame) => `${boss.key}-engine-${frame}`),
  ]),
  ...PICKUP_ART.map((kind) => `pickup-${kind}`),
  ...Array.from({ length: 8 }, (_, frame) => `shield-${frame}`),
  ...Array.from({ length: 6 }, (_, frame) => `spark-${frame}`),
  ...Array.from({ length: 8 }, (_, frame) => `drone-burst-${frame}`),
  ...Array.from({ length: 3 }, (_, stage) =>
    Array.from({ length: 3 }, (_, kind) => [
      `enemy-${stage}-${kind}`,
      `enemy-${stage}-${kind}-hit`,
      ...Array.from(
        { length: 8 },
        (_, frame) => `enemy-${stage}-${kind}-engine-${frame}`,
      ),
      ...Array.from(
        { length: 8 },
        (_, frame) => `enemy-${stage}-${kind}-destroy-${frame}`,
      ),
    ]).flat(),
  ).flat(),
] as const;
