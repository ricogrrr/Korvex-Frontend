/* Wire-shaped types - mirror the proto payloads our backend speaks.
   Naming follows the decompiled schema (UuidAndUsername, InstalledMod, push
   messages); keep field names camelCase so fixtures read clean. */

export interface UuidAndUsername {
  uuid: string;
  username: string;
}

export type PresenceState = 'ingame' | 'online' | 'away' | 'offline';

export interface Presence {
  state: PresenceState;
  /** Server address when in-game, e.g. "hypixel.net". */
  server?: string;
}

export interface UserProfile {
  player: UuidAndUsername;
  plus: boolean;
  friendsCount: number;
  cosmeticsOwned: number;
}

export interface FriendEntry {
  player: UuidAndUsername;
  presence: Presence;
  addedAt: string; // ISO
}

export interface FriendRequest {
  player: UuidAndUsername;
  at: string;
}

export type ModCategory =
  | 'hud'
  | 'combat'
  | 'motion'
  | 'world'
  | 'chat'
  | 'performance'
  | 'cosmetics';

export interface InstalledMod {
  id: string;
  name: string;
  category: ModCategory;
  description: string;
  version: string;
  enabled: boolean;
  hasSettings: boolean;
}

export type CosmeticType = 'cloak' | 'hat' | 'pet' | 'body' | 'emote' | 'spray';
export type CosmeticRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'limited';

export interface Cosmetic {
  id: string;
  type: CosmeticType;
  name: string;
  rarity: CosmeticRarity;
  owned: boolean;
  /** Cents; undefined when owned or not for sale. */
  priceCents?: number;
  /** Token colour used by the canvas preview. */
  previewColor: string;
  /** Catalog texture path served from the backend at /assets/<resource>. */
  resource?: string;
  /** ISO timestamp - limited items stop selling after this. */
  limitedUntil?: string;
  /** Total copies sold so far (limited items). */
  soldCount?: number;
  /** Your serial number - the Nth copy ever sold (limited, when owned). */
  ownedSerial?: number;
}

export interface PlayerCosmetics {
  /** Equipped cosmetic ids per type slot. */
  equipped: Partial<Record<CosmeticType, string[]>>;
}

export interface GameVersion {
  id: string;
  name: string;
  mcVersion: string;
  installed: boolean;
  lastPlayed?: string;
  ramMb: number;
  gameDir: string;
}

export interface GameVersionList {
  versions: GameVersion[];
  /** The version the launcher will start on Play. */
  activeId: string | null;
}

export interface InstallProgress {
  id: string;
  stage: 'client' | 'libraries' | 'assets' | 'done' | string;
  done: number;
  total: number;
}

export interface GameStatus {
  id: string;
  state: 'launched' | 'exited';
  pid?: number;
  code?: number;
  signal?: string | null;
  /** Launch went through the korvex-<id> fabric profile (client mod loaded). */
  modded?: boolean;
}

export interface GameTelemetry {
  fps: number;
  mcVersion: string;
  server?: string;
  serverType?: 'multiplayer' | 'singleplayer';
  position?: { x: number; y: number; z: number };
  dimension?: string;
  inGame: boolean;
}

export interface GameIpcInfo {
  mod: string;
  version: string;
  launchId: string;
  username?: string;
  uuid?: string;
  mods: string[];
}

/* game.GameSession push - issued after the mod proves account ownership via
   Mojang's join/hasJoined pair. verified=false is expected for dev launches
   with dummy/offline sessions. */
export interface GameSession {
  token?: string;
  username?: string;
  mcUuid?: string;
  verified: boolean;
  error?: string;
}

export interface GameIpcState {
  connected: boolean;
  info: GameIpcInfo | null;
  telemetry: GameTelemetry | null;
}

export interface LaunchState {
  state: 'idle' | 'running';
  version?: string;
  pid?: number;
  startedAt?: number;
}

export interface CatalogItem {
  cosmetic: Cosmetic;
  blurb: string;
  featured?: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  blurb?: string;
  /** Cents; undefined when all items owned or not for sale. */
  priceCents?: number;
  /** Derived server-side - the rarest item's rarity. */
  rarity?: CosmeticRarity;
  /** Cosmetics granted by the bundle. */
  items: Cosmetic[];
}

export interface BundleItem {
  bundle: Bundle;
  featured?: boolean;
}

export interface ChatMessage {
  id: string;
  /** 1:1 thread key - the other player's uuid. */
  threadId: string;
  /** 'self' or a player uuid. */
  from: 'self' | string;
  text: string;
  at: string; // ISO
}

export type NotificationSeverity = 'success' | 'warn' | 'danger' | 'info';

export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  title: string;
  description?: string;
  at: string;
  /** Absent/false = unread. */
  read?: boolean;
}

export type ModSettingValue = boolean | number | string;

/* ---- auth ---- */

export interface PopupLoginInfo {
  authorizeUri: string;
  state: string;
}

export interface DeviceLoginInfo {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  intervalSeconds: number;
}

export type LoginPoll =
  | { status: 'pending' }
  | { status: 'error'; error: string }
  | { status: 'ok'; player: { uuid: string; username: string }; token: string };

interface ModSettingBase {
  key: string;
  label: string;
  description?: string;
}

export interface ModSettingToggle extends ModSettingBase {
  kind: 'toggle';
  value: boolean;
}
export interface ModSettingSlider extends ModSettingBase {
  kind: 'slider';
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}
export interface ModSettingDropdown extends ModSettingBase {
  kind: 'dropdown';
  value: string;
  options: { value: string; label: string }[];
}
export interface ModSettingColor extends ModSettingBase {
  kind: 'color';
  value: string;
}

export type ModSetting = ModSettingToggle | ModSettingSlider | ModSettingDropdown | ModSettingColor;

/** A saved multiplayer server in the player's list. */
export interface ServerEntry {
  address: string;
  name: string;
  addedAt?: string;
}

/** Result of a Server List Ping (post-1.6 SLP) against one address. */
export interface ServerPing {
  online: boolean;
  pingMs: number;
  motd?: string;
  playersOnline?: number;
  playersMax?: number;
  version?: string;
  favicon?: string;
  error?: string;
}

/** Response from update.Check - channel follows settings.channel. */
export interface UpdateCheckResult {
  channel: string;
  current: string;
  update: boolean;
  version?: string;
  notes?: string;
  url?: string;
  feed?: string | null;
  error?: string;
  checkedAt?: string;
}

/** Launcher-wide client settings, persisted by the settings service. */
export interface ClientSettings {
  channel: string;
  autoUpdate: boolean;
  telemetry: boolean;
  /** Custom .minecraft-equivalent root - empty uses the default data/game dir. */
  gameDir: string;
  /** UI language - only 'en' ships for now; the i18n scaffold reads this. */
  locale: string;
  /* Video/window options live in Minecraft's own video settings - the
     launcher only stores Korvex-side toggles here. */
  autoSprint: boolean;
  showOwnName: boolean;
  hudScale: number;
  hudBg: boolean;
  accentColor: string;
}
