/** Artist-derived beam textures and deterministic warning graphics. See asset credits. */
export const TACTICAL_IMAGES = [
  'tactical-escort-super-1',
  'tactical-escort-super-2',
  'tactical-escort-super-3',
  'tactical-beam-core',
  'tactical-beam-energy',
  'tactical-beam-head',
  'tactical-beam-tail',
  'tactical-beam-halo',
  'tactical-danger-tile',
  'tactical-danger-alert',
  'tactical-bullet-white',
  'tactical-bullet-red',
  'tactical-bullet-edge',
] as const;

export type TacticalImageKey = (typeof TACTICAL_IMAGES)[number];

export const TACTICAL_ASSET_BASE = '/assets/tactical-remake/';

export const TACTICAL_FONTS = {
  hud: '/assets/tactical-remake/fonts/MGS1%20HUD.ttf',
  codec: '/assets/tactical-remake/fonts/MGS1%20Codec.ttf',
  ammo: '/assets/tactical-remake/fonts/MGS1%20Ammo.ttf',
} as const;
