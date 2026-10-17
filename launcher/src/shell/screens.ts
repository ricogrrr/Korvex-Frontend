import { Gamepad2, Layers, Puzzle, Server, ShoppingBag, SlidersHorizontal, Sparkles, Users, type LucideIcon } from 'lucide-react';

export type ScreenId = 'home' | 'versions' | 'servers' | 'mods' | 'cosmetics' | 'social' | 'store' | 'settings' | 'profile' | 'dev';

export interface ScreenDef {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
}

/** Icon rail order. `profile`/`dev` stay out of the rail - #/profile via the
   account card, #/dev only. */
export const SCREENS: ScreenDef[] = [
  { id: 'home', label: 'Home', icon: Gamepad2 },
  { id: 'versions', label: 'Versions', icon: Layers },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'mods', label: 'Mods', icon: Puzzle },
  { id: 'cosmetics', label: 'Cosmetics', icon: Sparkles },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export function routeFromHash(hash: string): ScreenId {
  const id = hash.replace(/^#\/?/, '') as ScreenId;
  return SCREENS.some((s) => s.id === id) || id === 'dev' || id === 'profile' ? id : 'home';
}
