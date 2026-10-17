import { useState, type ReactNode } from 'react';
import { Download, Folder, PackageOpen, Plus, Settings, Trash2 } from 'lucide-react';
import {
  Badge, Button, ColorPicker, Dropdown, EmptyState, IconButton, InlineBanner, SearchField,
  SectionLabel, Skeleton, Slider, Toggle, toast, SWATCHES, type ButtonVariant,
} from '@korvex/ui';
import { Titlebar } from '../shell/Titlebar';
import { PRESENCE, SURFACES, TYPE_SCALE, VERSION_OPTIONS } from './demoData';

const SECTIONS = [
  ['tokens', 'Tokens'], ['type', 'Typography'], ['buttons', 'Buttons'], ['toggle', 'Toggle'],
  ['slider', 'Slider'], ['dropdown', 'Dropdown'], ['color', 'Color picker'], ['search', 'Search field'],
  ['badges', 'Badges'], ['feedback', 'Banners and toasts'], ['loading', 'Skeleton'], ['empty', 'Empty state'],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-b border-border-subtle px-8 py-8">
      <SectionLabel className="pb-4">{title}</SectionLabel>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-8 py-3">
      <div className="w-40 shrink-0 pt-1 text-meta text-fg-secondary">{label}</div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

export function DevPage() {
  const [on, setOn] = useState(true);
  const [ram, setRam] = useState(4096);
  const [scale, setScale] = useState(100);
  const [version, setVersion] = useState('pvp-1-21-4');
  const [color, setColor] = useState(SWATCHES[4]);
  const [query, setQuery] = useState('');

  return (
    <div className="flex h-full flex-col bg-base">
      <Titlebar />
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Components" className="flex w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border-subtle bg-elevated p-3">
          <SectionLabel className="px-2 pb-2">Component kit</SectionLabel>
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ block: 'start' })}
              className="h-ctl-sm rounded-md px-2 text-left text-body text-fg-secondary transition-colors duration-fast focus-ring-inset hover:bg-hover hover:text-fg active:bg-pressed"
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Section id="tokens" title="Tokens">
            <Row label="Surfaces and semantic">
              {SURFACES.map((s) => (
                <div key={s.name} className="flex w-24 flex-col gap-1">
                  <div className={`h-8 rounded-md border border-border ${s.cls}`} />
                  <span className="text-meta text-fg-secondary">{s.name}</span>
                </div>
              ))}
            </Row>
            <Row label="Presence">
              {PRESENCE.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.cls}`} />
                  <span className="text-body">{p.name}</span>
                </div>
              ))}
            </Row>
          </Section>

          <Section id="type" title="Typography">
            {TYPE_SCALE.map((t) => (
              <Row key={t.label} label={t.label}>
                <span className={t.cls}>Playing on PvP 1.21.4</span>
              </Row>
            ))}
            <Row label="11 label">
              <SectionLabel>Recently played</SectionLabel>
            </Row>
            <Row label="Mono">
              <span className="font-mono text-meta tabular-nums">e7c1a9d2-4b3f-4a8e-9c52-0d1f6b7a3e48</span>
              <span className="font-mono text-meta tabular-nums text-fg-secondary">42 ms</span>
              <span className="font-mono text-meta tabular-nums text-fg-secondary">18.4 MB</span>
            </Row>
          </Section>

          <Section id="buttons" title="Buttons">
            {VARIANTS.map((v) => (
              <Row key={v} label={v}>
                <Button variant={v} size="md">Launch game</Button>
                <Button variant={v} size="sm">Launch game</Button>
                <Button variant={v} size="md" icon={Download}>Install</Button>
                <Button variant={v} size="md" disabled>Disabled</Button>
              </Row>
            ))}
            <Row label="Icon buttons">
              <IconButton label="Open game folder" icon={Folder} />
              <IconButton label="Mod settings" icon={Settings} variant="secondary" />
              <IconButton label="Remove instance" icon={Trash2} variant="danger" />
              <IconButton label="Add instance" icon={Plus} variant="primary" size="sm" />
              <IconButton label="Unavailable" icon={Settings} disabled />
            </Row>
          </Section>

          <Section id="toggle" title="Toggle">
            <Row label="On / off">
              <Toggle checked={on} onCheckedChange={setOn} aria-label="Enable Fullbright" />
              <Toggle checked={!on} onCheckedChange={(v) => setOn(!v)} aria-label="Enable Zoom" />
            </Row>
            <Row label="Disabled">
              <Toggle checked disabled onCheckedChange={() => undefined} aria-label="Locked on" />
              <Toggle checked={false} disabled onCheckedChange={() => undefined} aria-label="Locked off" />
            </Row>
          </Section>

          <Section id="slider" title="Slider">
            <Row label="Memory">
              <div className="w-80"><Slider aria-label="Memory" value={ram} onValueChange={setRam} min={1024} max={16384} step={512} unit=" MB" /></div>
            </Row>
            <Row label="HUD scale">
              <div className="w-80"><Slider aria-label="HUD scale" value={scale} onValueChange={setScale} min={50} max={200} step={5} unit="%" /></div>
            </Row>
            <Row label="Disabled">
              <div className="w-80"><Slider aria-label="Locked" value={60} onValueChange={() => undefined} min={0} max={100} unit="%" disabled /></div>
            </Row>
          </Section>

          <Section id="dropdown" title="Dropdown">
            <Row label="Version picker">
              <div className="w-80"><Dropdown aria-label="Game version" value={version} onValueChange={setVersion} options={VERSION_OPTIONS} /></div>
            </Row>
            <Row label="Small / disabled">
              <div className="w-48"><Dropdown aria-label="Game version small" size="sm" value={version} onValueChange={setVersion} options={VERSION_OPTIONS} /></div>
              <div className="w-48"><Dropdown aria-label="Game version disabled" disabled value={version} onValueChange={setVersion} options={VERSION_OPTIONS} /></div>
            </Row>
          </Section>

          <Section id="color" title="Color picker">
            <Row label="Default / disabled">
              <ColorPicker aria-label="HUD text colour" value={color} onChange={setColor} swatches={SWATCHES} />
              <ColorPicker aria-label="Locked colour" value={color} onChange={() => undefined} disabled />
            </Row>
          </Section>

          <Section id="search" title="Search field">
            <Row label="Live filter">
              <SearchField className="w-80" value={query} onChange={setQuery} placeholder="Search mods" />
              <span className="text-meta text-fg-secondary">{query ? `Filtering for "${query}"` : 'Esc clears the field'}</span>
            </Row>
          </Section>

          <Section id="badges" title="Badges">
            <Row label="Tones">
              <Badge>Optimization</Badge>
              <Badge tone="accent">Selected</Badge>
              <Badge tone="success">Installed</Badge>
              <Badge tone="warn">Update available</Badge>
              <Badge tone="danger">Incompatible</Badge>
              <Badge tone="info">New</Badge>
            </Row>
            <Row label="Mono">
              <Badge mono>1.21.4</Badge>
              <Badge mono tone="success">42 ms</Badge>
            </Row>
          </Section>

          <Section id="feedback" title="Banners and toasts">
            <div className="flex max-w-2xl flex-col gap-3 pb-3">
              <InlineBanner severity="info" title="Mods are loading from cache">Fresh data arrives when the connection settles.</InlineBanner>
              <InlineBanner severity="success" title="Profile synced">Your cosmetics are up to date on this device.</InlineBanner>
              <InlineBanner severity="warn" title="Low memory allocated" action={{ label: 'Adjust memory', onClick: () => undefined }}>
                Survival 1.20.6 has 1 GB. Large mod packs may stutter.
              </InlineBanner>
              <InlineBanner severity="danger" title="Couldn't reach the Korvex servers" action={{ label: 'Retry', onClick: () => undefined }}>
                Check your connection. Offline play still works.
              </InlineBanner>
            </div>
            <Row label="Toasts">
              <Button size="sm" onClick={() => toast.info('Downloading Sodium 0.6.1')}>Info</Button>
              <Button size="sm" onClick={() => toast.success('Profile saved')}>Success</Button>
              <Button size="sm" onClick={() => toast.warn('Update available', { description: 'Korvex 0.2.0 is ready to install.' })}>Warn</Button>
              <Button size="sm" onClick={() => toast.danger('Install failed', { description: 'Not enough disk space on C:.', action: { label: 'Open settings', onClick: () => undefined } })}>Danger</Button>
            </Row>
          </Section>

          <Section id="loading" title="Skeleton">
            <Row label="Mod row">
              <div className="flex w-96 items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-9" />
              </div>
            </Row>
          </Section>

          <Section id="empty" title="Empty state">
            <div className="h-48 max-w-2xl rounded-md border border-border-subtle bg-elevated">
              <EmptyState icon={PackageOpen} message="No mods match that search." action={{ label: 'Clear filters', onClick: () => setQuery('') }} />
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
