import { Box, Pickaxe, Swords } from 'lucide-react';
import type { DropdownOption } from '@korvex/ui';

/* Demo-only data for the component page. Real screens read from services/. */
export const VERSION_OPTIONS: DropdownOption[] = [
  { value: 'pvp-1-21-4', label: 'PvP 1.21.4', meta: '1.21.4', icon: Swords },
  { value: 'survival-1-20-6', label: 'Survival 1.20.6', meta: '1.20.6', icon: Pickaxe },
  { value: 'legacy-1-8-9', label: 'Legacy 1.8.9', meta: '1.8.9', icon: Box },
  { value: 'snapshot', label: 'Snapshot 25w09a', meta: 'not installed', icon: Box, disabled: true },
];

export const SURFACES = [
  { name: 'Base', cls: 'bg-base' },
  { name: 'Elevated', cls: 'bg-elevated' },
  { name: 'Floating', cls: 'bg-floating' },
  { name: 'Hover', cls: 'bg-hover' },
  { name: 'Pressed', cls: 'bg-pressed' },
  { name: 'Accent', cls: 'bg-accent' },
  { name: 'Success', cls: 'bg-success' },
  { name: 'Warn', cls: 'bg-warn' },
  { name: 'Danger', cls: 'bg-danger' },
  { name: 'Info', cls: 'bg-info' },
];

export const PRESENCE = [
  { name: 'In game', cls: 'bg-presence-ingame' },
  { name: 'Online', cls: 'bg-presence-online' },
  { name: 'Away', cls: 'bg-presence-away' },
  { name: 'Offline', cls: 'bg-presence-offline' },
];

export const TYPE_SCALE = [
  { cls: 'text-display font-semibold', label: '28 display' },
  { cls: 'text-xl font-semibold', label: '20 title' },
  { cls: 'text-lg font-medium', label: '16 heading' },
  { cls: 'text-ui', label: '14 emphasis' },
  { cls: 'text-body', label: '13 body' },
  { cls: 'text-meta text-fg-secondary', label: '12 secondary meta' },
] as const;
