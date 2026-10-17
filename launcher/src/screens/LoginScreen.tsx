import { useState } from 'react';
import { Button, InlineBanner, SearchField } from '@korvex/ui';
import { services } from '../services';
import { addAccountPending, cancelAddAccount, upsertAccount } from '../services/accounts';

/* Microsoft login popup -> lands on Microsoft's desktop page with ?code= in
   the URL -> paste that URL back and the server finishes the exchange. (The
   approved client ID accepts no other redirect, and device code is refused -
   this is the best UX available on the first-party app.) */
export function LoginScreen() {
  const [phase, setPhase] = useState<'idle' | 'paste' | 'error'>('idle');
  const [state, setState] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = (token: string, player: { uuid: string; username: string }) => {
    try {
      localStorage.removeItem('korvex.add-account');
      localStorage.setItem('korvex.auth.token', token);
    } catch {
      /* storage unavailable - session still works until reload */
    }
    upsertAccount({ uuid: player.uuid, username: player.username, token });
    window.location.reload();
  };

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : String(e));
    setPhase('error');
  };

  const complete = async (code: string, st: string) => {
    setBusy(true);
    try {
      const r = await services.auth.completeLogin(st, code);
      if (r.status === 'ok') return finish(r.token, r.player);
      fail(new Error(r.error));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* Embedded path: the main process watches the Microsoft redirect and hands
     the code back - no URL copying. Plain-browser dev falls back to paste. */
  const start = async () => {
    setError('');
    try {
      const d = await services.auth.startLogin();
      setState(d.state);
      const bridge = window.korvex?.auth;
      if (bridge) {
        setBusy(true);
        try {
          const r = await bridge.login(d.authorizeUri);
          if (r.code) await complete(r.code, d.state);
          else if (!r.canceled) fail(new Error('sign-in closed before completion'));
        } finally {
          setBusy(false);
        }
      } else {
        window.open(d.authorizeUri, '_blank');
        setPhase('paste');
      }
    } catch (e) {
      fail(e);
    }
  };

  const submit = async () => {
    const code = new URL(url, 'https://x').searchParams.get('code');
    if (!code) {
      setError("that URL doesn't contain a code - copy the full address from the browser after signing in");
      setPhase('error');
      return;
    }
    await complete(code, state);
  };

  return (
    <div className="flex h-full items-center justify-center bg-base">
      <div className="flex w-96 flex-col gap-4 rounded-md border border-border bg-elevated p-6">
        <div>
          <h1 className="text-lg font-semibold text-fg">Sign in to Korvex</h1>
          <p className="mt-1 text-meta text-fg-tertiary">Microsoft account that owns Minecraft Java.</p>
        </div>

        {phase === 'paste' ? (
          <div className="flex flex-col gap-3">
            <p className="text-body text-fg-tertiary">
              Signed in? The browser landed on a page starting with
              <span className="font-mono text-fg"> login.live.com/oauth20_desktop.srf </span>-
              copy the full address bar and paste it here:
            </p>
            <SearchField
              value={url}
              onChange={setUrl}
              onKeyDown={(e) => e.key === 'Enter' && !busy && void submit()}
              placeholder="https://login.live.com/oauth20_desktop.srf?code=…"
            />
            <Button variant="primary" onClick={() => void submit()} disabled={busy || !url.trim()}>
              {busy ? 'Signing in…' : 'Continue'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setUrl(''); setPhase('idle'); }}>
              Back
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={() => void start()}>Sign in with Microsoft</Button>
        )}

        {phase === 'error' && <InlineBanner severity="danger" title={error} />}

        {/* Add-account flow: landing here from the switcher, a canceled login
            should restore the previous account, not strand us on this page. */}
        {addAccountPending() && (
          <Button variant="ghost" size="sm" onClick={cancelAddAccount}>
            Back to previous account
          </Button>
        )}
      </div>
    </div>
  );
}
