import { UserPlus } from 'lucide-react';
import { Button } from '@korvex/ui';
import { services } from '../services';
import { currentToken, listAccounts, signOut, startAddAccount, switchTo } from '../services/accounts';
import { SkinPreview } from './SkinPreview';

/* Account popover over the rail - username, rotating 3D skin preview, the
   remembered-account switcher (Lunar accounts.json pattern), and sign-out.
   Switching accounts is a local token swap + reload: the backend issues one
   Korvex token per Microsoft identity and keeps every account's data. */
export function AccountCard({ username, uuid, onClose }: { username: string; uuid: string; onClose: () => void }) {
  const others = listAccounts().filter((a) => a.token !== currentToken());

  return (
    <>
      <button
        type="button"
        aria-label="Close account"
        className="fixed inset-0 z-floating cursor-default bg-transparent"
        onClick={onClose}
      />
      <div className="absolute left-full bottom-0 z-floating ml-3 flex w-64 flex-col items-center gap-3 rounded-md border border-border bg-floating p-4 shadow-floating">
        <div className="text-center">
          <p className="text-body font-semibold text-fg">{username}</p>
          <p className="text-meta text-fg-tertiary">{uuid}</p>
        </div>
        <SkinPreview uuid={uuid} username={username} />
        <p className="text-meta text-fg-tertiary">Drag to rotate</p>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            window.location.hash = '/profile';
            onClose();
          }}
        >
          View profile
        </Button>

        {/* Remembered accounts - one click switches the active session. */}
        {others.length > 0 && (
          <div className="flex w-full flex-col gap-1 border-t border-border-subtle pt-3">
            <p className="text-label font-semibold uppercase tracking-label text-fg-tertiary">Accounts</p>
            {others.map((a) => (
              <button
                key={a.uuid}
                type="button"
                onClick={() => switchTo(a)}
                className="rounded-md px-2 py-1.5 text-left text-body text-fg transition-colors duration-fast focus-ring hover:bg-hover"
              >
                {a.username}
              </button>
            ))}
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={startAddAccount}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Add account
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={() => signOut(() => services.auth.logout())}>
          Sign out
        </Button>
      </div>
    </>
  );
}
