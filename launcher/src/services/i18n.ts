/* i18n scaffold - 'en' is the only shipped dictionary today; the shape is
   stable so adding a locale is a dictionary file + an entry, not a refactor.
   usage: const { t } = useI18n(); t('nav.servers') - falls back to the key
   itself so a missing string degrades to the English source, not a crash. */

import { useMemo } from 'react';
import { services } from '.';
import { useService } from '../hooks/useService';

type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home',
  'nav.versions': 'Versions',
  'nav.servers': 'Servers',
  'nav.mods': 'Mods',
  'nav.cosmetics': 'Cosmetics',
  'nav.social': 'Social',
  'nav.store': 'Store',
  'nav.settings': 'Settings',
  'nav.profile': 'Profile',
  'action.play': 'Play',
  'action.install': 'Install',
  'action.signOut': 'Sign out',
  'action.addAccount': 'Add account',
  'action.viewProfile': 'View profile',
  'action.addServer': 'Add',
  'settings.gameDir': 'Game directory',
  'settings.locale': 'Language',
  'settings.checkUpdates': 'Check for updates',
};

const DICTS: Record<string, Dict> = { en };

/** Translate `key` for `locale` - key fallback keeps missing strings readable. */
export function translate(locale: string, key: string): string {
  const dict = DICTS[locale] ?? DICTS.en;
  return dict[key] ?? en[key] ?? key;
}

/** Locale-aware `t()` bound to the persisted settings.locale. */
export function useI18n(): { t: (key: string) => string; locale: string } {
  const { data } = useService(services.settings.get);
  const locale = data?.settings.locale ?? 'en';
  return useMemo(() => ({ t: (key: string) => translate(locale, key), locale }), [locale]);
}
