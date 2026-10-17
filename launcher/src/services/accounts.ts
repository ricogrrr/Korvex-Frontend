/* Local multi-account store - Lunar accounts.json pattern.
   The server already issues one Korvex token per Microsoft identity, so
   "accounts" on this client are just remembered (uuid, username, token)
   triples; switching is a token swap + reload. The store lives in
   localStorage - dev-browser and Electron share the same persistence. */

export interface AccountEntry {
  uuid: string;
  username: string;
  token: string;
}

const ACCOUNTS_KEY = 'korvex.accounts';
const TOKEN_KEY = 'korvex.auth.token';
/* Set before kicking to the login flow from the account switcher - lets the
   login screen offer "Back" so a canceled add-account doesn't strand the
   user on the login page when they still have a working account. */
export const ADD_ACCOUNT_KEY = 'korvex.add-account';

function read(): AccountEntry[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as AccountEntry[]).filter((a) => a?.token && a?.uuid) : [];
  } catch {
    return [];
  }
}

function write(list: AccountEntry[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch { /* private mode - session still works until reload */ }
}

export function listAccounts(): AccountEntry[] {
  return read();
}

/** Remember (or re-token) an account after login. */
export function upsertAccount(entry: AccountEntry): void {
  const list = read().filter((a) => a.uuid !== entry.uuid);
  list.push(entry);
  write(list);
}

export function removeAccount(uuid: string): void {
  write(read().filter((a) => a.uuid !== uuid));
}

export function currentToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function currentAccount(): AccountEntry | null {
  const t = currentToken();
  return t ? read().find((a) => a.token === t) ?? null : null;
}

/** Switch the active session to a remembered account. */
export function switchTo(entry: AccountEntry): void {
  try {
    localStorage.removeItem(ADD_ACCOUNT_KEY);
    localStorage.setItem(TOKEN_KEY, entry.token);
  } catch { /* private mode */ }
  window.location.reload();
}

/** Kick into the login flow while preserving existing accounts.
    The key doubles as memory of WHICH token was active - the first stored
    account isn't necessarily the one the user had selected. */
export function startAddAccount(): void {
  try {
    localStorage.setItem(ADD_ACCOUNT_KEY, currentToken() ?? '1');
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode */ }
  window.location.reload();
}

/** Cancel out of add-account - restore the previously active token, if any. */
export function cancelAddAccount(): void {
  try {
    const prev = localStorage.getItem(ADD_ACCOUNT_KEY);
    localStorage.removeItem(ADD_ACCOUNT_KEY);
    if (prev && prev !== '1') localStorage.setItem(TOKEN_KEY, prev);
  } catch { /* private mode */ }
  window.location.reload();
}

export function addAccountPending(): boolean {
  try {
    return localStorage.getItem(ADD_ACCOUNT_KEY) !== null;
  } catch {
    return false;
  }
}

/** Sign out of the current account: drop it from the store and either switch
   to another remembered account or fall back to a fresh login. */
export function signOut(logout: () => Promise<unknown>): void {
  const cur = currentAccount();
  try {
    localStorage.removeItem(ADD_ACCOUNT_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode */ }
  if (cur) removeAccount(cur.uuid);
  const next = read()[0];
  if (next) {
    try {
      localStorage.setItem(TOKEN_KEY, next.token);
    } catch { /* private mode */ }
  }
  void logout().catch(() => {}).finally(() => window.location.reload());
}
