import type {
  CatalogItem, ChatMessage, ClientSettings, Cosmetic, FriendEntry, FriendRequest, GameVersion,
  InstalledMod, ModSetting, NotificationItem, PlayerCosmetics, UserProfile,
} from './types';

export const PROFILE: UserProfile = {
  player: { uuid: '00000000-0000-4000-8000-000000000000', username: 'DevPlayer' },
  plus: false,
  friendsCount: 6,
  cosmeticsOwned: 9,
};

export const FRIENDS: FriendEntry[] = [
  { player: { uuid: '7e2b1a9c-4f3d-4e8a-b6c9-1d5e7a2f8b3c', username: 'VoidWing' }, presence: { state: 'ingame', server: 'hypixel.net' }, addedAt: '2025-11-02T14:00:00Z' },
  { player: { uuid: 'b4c8f1d3-9a2e-4c7b-a5d8-2e6f9b1c4a7d', username: 'Meridian' }, presence: { state: 'online' }, addedAt: '2025-12-14T19:30:00Z' },
  { player: { uuid: 'd9e3a7f2-1b5c-4d8e-a7f2-3c9d5e7b2a4f', username: 'Sable' }, presence: { state: 'ingame', server: 'play.hypixel.net' }, addedAt: '2026-01-08T22:15:00Z' },
  { player: { uuid: 'f1a4c8e7-2d6b-4e9f-a8c3-4b7d2e9f5a1b', username: 'Quartzine' }, presence: { state: 'away' }, addedAt: '2026-02-21T08:45:00Z' },
  { player: { uuid: 'c7d2e9a4-6f1b-4a8c-b9e4-5d8a3c6f1e2d', username: 'Nighthawk' }, presence: { state: 'offline' }, addedAt: '2026-03-15T17:20:00Z' },
  { player: { uuid: 'e5b7d1f8-3c9a-4e2d-a6f5-8c1b4d7e9a3f', username: 'Tilth' }, presence: { state: 'offline' }, addedAt: '2026-04-02T11:05:00Z' },
];

export const FRIEND_REQUESTS: FriendRequest[] = [
  { player: { uuid: 'a8c4e7b1-5d3f-4a2c-b7e6-9f2d5a8c1e4b', username: 'Glisten' }, at: '2026-10-14T16:22:00Z' },
];

export const MODS: InstalledMod[] = [
  { id: 'fps', name: 'FPS', category: 'hud', description: 'Frames per second counter with min/avg tracking.', version: '2.4.1', enabled: true, hasSettings: true },
  { id: 'keystrokes', name: 'Keystrokes', category: 'hud', description: 'On-screen WASD, mouse buttons and CPS display.', version: '3.1.0', enabled: true, hasSettings: true },
  { id: 'coords', name: 'Coordinates', category: 'hud', description: 'Player position, biome and facing direction.', version: '1.9.2', enabled: true, hasSettings: true },
  { id: 'ping', name: 'Ping', category: 'hud', description: 'Latency to the current server, with history graph.', version: '1.5.0', enabled: false, hasSettings: true },
  { id: 'armor-status', name: 'Armor Status', category: 'hud', description: 'Durability bars for worn armor and held item.', version: '2.0.4', enabled: true, hasSettings: true },
  { id: 'potion-effects', name: 'Potion Effects', category: 'hud', description: 'Active effect list with remaining duration.', version: '1.7.3', enabled: true, hasSettings: true },
  { id: 'reach-display', name: 'Reach Display', category: 'combat', description: 'Shows the distance of your last attack.', version: '1.3.1', enabled: true, hasSettings: false },
  { id: 'hitboxes', name: 'Hitboxes', category: 'combat', description: 'Enhanced entity hitbox rendering and eye line.', version: '2.2.0', enabled: true, hasSettings: true },
  { id: 'auto-sprint', name: 'Auto Sprint', category: 'motion', description: 'Sprint without double-tapping W.', version: '1.4.2', enabled: true, hasSettings: false },
  { id: 'toggle-sneak', name: 'Toggle Sneak/Sprint', category: 'motion', description: 'Toggle sneak and sprint states.', version: '2.1.0', enabled: false, hasSettings: true },
  { id: 'freelook', name: 'Freelook', category: 'motion', description: 'Rotate the camera without turning your player.', version: '1.8.5', enabled: true, hasSettings: true },
  { id: 'zoom', name: 'Zoom', category: 'motion', description: 'Hold to zoom with configurable smoothness.', version: '2.0.1', enabled: true, hasSettings: true },
  { id: 'waypoints', name: 'Waypoints', category: 'world', description: 'Personal and server waypoints with death markers.', version: '3.0.2', enabled: true, hasSettings: true },
  { id: 'chunk-borders', name: 'Chunk Borders', category: 'world', description: 'Render chunk edges and slime chunks.', version: '1.2.6', enabled: false, hasSettings: false },
  { id: 'clock', name: 'Clock', category: 'world', description: 'In-game or real time in the HUD.', version: '1.1.8', enabled: true, hasSettings: true },
  { id: 'chat-filter', name: 'Chat Filter', category: 'chat', description: 'Filter chat by keyword, regex or channel.', version: '2.3.0', enabled: true, hasSettings: true },
  { id: 'timestamps', name: 'Timestamps', category: 'chat', description: 'Timestamps on chat messages.', version: '1.0.4', enabled: true, hasSettings: false },
  { id: 'optifine-shims', name: 'Dynamic Lights', category: 'performance', description: 'Dynamic lighting from held and dropped items.', version: '1.6.0', enabled: true, hasSettings: true },
  { id: 'nametags', name: 'Nametags', category: 'cosmetics', description: 'Styled nametags, own-name visibility, badge icons.', version: '2.2.1', enabled: true, hasSettings: true },
  { id: 'namemc', name: 'NameMC', category: 'cosmetics', description: 'NameMC profile lookup in the player list.', version: '1.1.0', enabled: false, hasSettings: false },
];

/* Fixture swatch colours - data, not chrome styling. */
const C = { purple: '#9B6BFF', red: '#F4554F', blue: '#4FA3FF', green: '#3ECF8E', amber: '#F5B83D', gray: '#9AA1A8', white: '#E8EAED' }; // rule-ok

export const COSMETICS: Cosmetic[] = [
  { id: 'cloak-void', type: 'cloak', name: 'Void Drift', rarity: 'legendary', owned: true, previewColor: C.purple },
  { id: 'cloak-ember', type: 'cloak', name: 'Emberfall', rarity: 'epic', owned: true, previewColor: C.red },
  { id: 'cloak-frost', type: 'cloak', name: 'Frostline', rarity: 'rare', owned: false, priceCents: 1499, previewColor: C.blue },
  { id: 'cloak-verdant', type: 'cloak', name: 'Verdant Wake', rarity: 'common', owned: false, priceCents: 799, previewColor: C.green },
  { id: 'hat-halo', type: 'hat', name: 'Static Halo', rarity: 'rare', owned: true, previewColor: C.amber },
  { id: 'hat-crown', type: 'hat', name: 'Korvex Crown', rarity: 'epic', owned: false, priceCents: 1999, previewColor: C.purple },
  { id: 'hat-beanie', type: 'hat', name: 'Dusk Beanie', rarity: 'common', owned: true, previewColor: C.gray },
  { id: 'pet-fox', type: 'pet', name: 'Ash Fox', rarity: 'epic', owned: false, priceCents: 2499, previewColor: C.amber },
  { id: 'pet-wisp', type: 'pet', name: 'Wisp', rarity: 'rare', owned: true, previewColor: C.blue },
  { id: 'pet-golem', type: 'pet', name: 'Mini Golem', rarity: 'legendary', owned: false, priceCents: 2999, previewColor: C.gray },
  { id: 'body-wings', type: 'body', name: 'Shard Wings', rarity: 'epic', owned: true, previewColor: C.purple },
  { id: 'body-band', type: 'body', name: 'Circuit Band', rarity: 'rare', owned: false, priceCents: 1299, previewColor: C.green },
  { id: 'emote-wave', type: 'emote', name: 'Wave', rarity: 'common', owned: true, previewColor: C.white },
  { id: 'emote-clap', type: 'emote', name: 'Slow Clap', rarity: 'common', owned: true, previewColor: C.amber },
  { id: 'emote-orbit', type: 'emote', name: 'Orbit Spin', rarity: 'epic', owned: false, priceCents: 999, previewColor: C.purple },
  { id: 'spray-kvx', type: 'spray', name: 'Korvex Sigil', rarity: 'uncommon', owned: true, previewColor: C.purple },
  { id: 'spray-grid', type: 'spray', name: 'Gridlock', rarity: 'rare', owned: false, priceCents: 499, previewColor: C.blue },
  { id: 'spray-eyes', type: 'spray', name: 'Watcher', rarity: 'epic', owned: false, priceCents: 799, previewColor: C.red },
];

export const MOD_SETTINGS: Record<string, ModSetting[]> = {
  fps: [
    { key: 'showStats', kind: 'toggle', label: 'Min/max tracking', description: 'Show lowest and average FPS alongside current.', value: true },
    { key: 'scale', kind: 'slider', label: 'Text scale', value: 100, min: 50, max: 150, step: 5, unit: '%' },
    { key: 'position', kind: 'dropdown', label: 'Position', value: 'top-left', options: [{ value: 'top-left', label: 'Top left' }, { value: 'top-right', label: 'Top right' }, { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-right', label: 'Bottom right' }] },
  ],
  keystrokes: [
    { key: 'showMouse', kind: 'toggle', label: 'Show mouse buttons', value: true },
    { key: 'showCps', kind: 'toggle', label: 'CPS counter', value: true },
    { key: 'scale', kind: 'slider', label: 'Module scale', value: 100, min: 50, max: 150, step: 5, unit: '%' },
  ],
  coords: [
    { key: 'showBiome', kind: 'toggle', label: 'Show biome', value: true },
    { key: 'showFacing', kind: 'toggle', label: 'Show facing', value: true },
    { key: 'precision', kind: 'dropdown', label: 'Decimal places', value: '1', options: [{ value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
  ],
  ping: [
    { key: 'sparkline', kind: 'toggle', label: 'History sparkline', value: true },
    { key: 'warnThreshold', kind: 'slider', label: 'Warn threshold', description: 'Highlight ping above this value.', value: 150, min: 50, max: 500, step: 10, unit: ' ms' },
  ],
  'armor-status': [
    { key: 'durabilityPct', kind: 'toggle', label: 'Durability percent', value: true },
    { key: 'heldItem', kind: 'toggle', label: 'Held item bar', value: false },
  ],
  'potion-effects': [
    { key: 'compact', kind: 'toggle', label: 'Compact mode', description: 'Icon-only rows.', value: false },
    { key: 'order', kind: 'dropdown', label: 'Sort order', value: 'duration', options: [{ value: 'duration', label: 'Duration' }, { value: 'name', label: 'Name' }, { value: 'amplifier', label: 'Amplifier' }] },
  ],
  'reach-display': [],
  hitboxes: [
    { key: 'eyeLine', kind: 'toggle', label: 'Eye line', value: true },
    { key: 'thickness', kind: 'slider', label: 'Line thickness', value: 2, min: 1, max: 5, step: 1, unit: ' px' },
  ],
  'auto-sprint': [],
  'toggle-sneak': [
    { key: 'notify', kind: 'toggle', label: 'State notifications', description: 'Toast when sneak/sprint toggles.', value: true },
  ],
  freelook: [
    { key: 'invertY', kind: 'toggle', label: 'Invert Y', value: false },
    { key: 'snapBack', kind: 'toggle', label: 'Snap back', description: 'Return camera forward on release.', value: true },
    { key: 'perspective', kind: 'dropdown', label: 'Perspective', value: 'third', options: [{ value: 'third', label: 'Third person' }, { value: 'first', label: 'First person' }] },
  ],
  zoom: [
    { key: 'smoothness', kind: 'slider', label: 'Smoothness', value: 6, min: 1, max: 10, step: 1 },
    { key: 'scrollZoom', kind: 'toggle', label: 'Scroll to zoom', value: true },
    { key: 'fovCap', kind: 'slider', label: 'FOV cap', value: 30, min: 10, max: 90, step: 5, unit: '°' },
  ],
  waypoints: [
    { key: 'deathMarkers', kind: 'toggle', label: 'Death markers', value: true },
    { key: 'renderDistance', kind: 'slider', label: 'Render distance', value: 500, min: 100, max: 1000, step: 50, unit: ' m' },
  ],
  'chunk-borders': [],
  clock: [
    { key: 'realTime', kind: 'toggle', label: 'Real time', description: 'Show system time instead of world time.', value: false },
    { key: 'format', kind: 'dropdown', label: 'Format', value: '24h', options: [{ value: '12h', label: '12 hour' }, { value: '24h', label: '24 hour' }] },
  ],
  'chat-filter': [
    { key: 'caseSensitive', kind: 'toggle', label: 'Case sensitive', value: false },
    { key: 'mode', kind: 'dropdown', label: 'Matched messages', value: 'hide', options: [{ value: 'hide', label: 'Hide' }, { value: 'highlight', label: 'Highlight' }] },
  ],
  timestamps: [],
  'optifine-shims': [
    { key: 'handheld', kind: 'toggle', label: 'Handheld items', value: true },
    { key: 'dropped', kind: 'toggle', label: 'Dropped items', value: true },
    { key: 'flicker', kind: 'toggle', label: 'Torch flicker', value: false },
  ],
  nametags: [
    { key: 'ownName', kind: 'toggle', label: 'Own nametag', value: false },
    { key: 'badges', kind: 'toggle', label: 'Badge icons', value: true },
    { key: 'accent', kind: 'color', label: 'Accent colour', value: '#9B6BFF' }, // rule-ok - fixture colour data
  ],
  'namemc': [],
};

export const EQUIPPED: PlayerCosmetics = {
  equipped: {
    cloak: ['cloak-void'],
    hat: ['hat-halo'],
    pet: ['pet-wisp'],
    body: ['body-wings'],
    emote: ['emote-wave', 'emote-clap'],
    spray: ['spray-kvx'],
  },
};

export const VERSIONS: GameVersion[] = [
  { id: 'korvex-1-21', name: 'Korvex 1.21.4', mcVersion: '1.21.4', installed: true, lastPlayed: '2026-10-14T20:41:00Z', ramMb: 4096, gameDir: 'instances/korvex-1.21' },
  { id: 'korvex-1-20', name: 'Korvex 1.20.4', mcVersion: '1.20.4', installed: true, lastPlayed: '2026-09-28T13:10:00Z', ramMb: 4096, gameDir: 'instances/korvex-1.20' },
  { id: 'korvex-1-8', name: 'Korvex 1.8.9', mcVersion: '1.8.9', installed: false, ramMb: 3072, gameDir: 'instances/korvex-1.8' },
  { id: 'vanilla-1-21', name: 'Vanilla 1.21.4', mcVersion: '1.21.4', installed: true, lastPlayed: '2026-08-12T09:02:00Z', ramMb: 2048, gameDir: 'instances/vanilla-1.21' },
];

export const CATALOG: CatalogItem[] = COSMETICS.filter((c) => !c.owned).map((c) => ({
  cosmetic: c,
  blurb:
    c.type === 'cloak' ? 'Animated trail behind your character.' :
    c.type === 'hat' ? 'Head slot cosmetic.' :
    c.type === 'pet' ? 'Follows you in lobbies and worlds.' :
    c.type === 'body' ? 'Worn on the player model.' :
    c.type === 'emote' ? 'Player-triggered animation.' : 'Placeable world decal.',
  featured: c.rarity === 'legendary' || c.rarity === 'epic',
}));

export const DEFAULT_SETTINGS: ClientSettings = {
  channel: 'stable',
  autoUpdate: true,
  telemetry: false,
  gameDir: '',
  locale: 'en',
  autoSprint: true,
  showOwnName: false,
  hudScale: 100,
  hudBg: true,
  accentColor: '#9B6BFF', // rule-ok - user's default accent value, a data payload not chrome
};

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', threadId: 'u-vex', from: 'u-vex', text: 'queue tonight?', at: '2026-10-15T18:00:00Z' },
  { id: 'm2', threadId: 'u-vex', from: 'self', text: 'yeah, 8pm', at: '2026-10-15T18:01:00Z' },
  { id: 'm3', threadId: 'u-nova', from: 'u-nova', text: 'gg last night', at: '2026-10-15T16:20:00Z' },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', severity: 'info', title: 'Korvex 1.21.4 update', description: 'Patch 0.9.3 - new waypoint module.', at: '2026-10-14T18:00:00Z' },
  { id: 'n2', severity: 'success', title: 'Cloak equipped', description: 'Void Drift is now active.', at: '2026-10-14T18:04:00Z' },
  { id: 'n3', severity: 'warn', title: 'RAM allocation high', description: '4096 MB allocated to Korvex 1.21.4.', at: '2026-10-14T19:30:00Z' },
];
