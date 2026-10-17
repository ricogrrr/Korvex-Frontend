import { Check, MessageSquare, Send, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, EmptyState, Icon, IconButton, SearchField, Skeleton, toast, cn } from '@korvex/ui';
import { ScreenFrame } from '../shell/ScreenFrame';
import { useService, useWsPush } from '../hooks/useService';
import { services, type ChatMessage, type FriendEntry, type PresenceState } from '../services';

const PRESENCE_LABEL: Record<PresenceState, string> = {
  ingame: 'In game',
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

function Avatar({ username, presence }: { username: string; presence?: PresenceState }) {
  return (
    <div className="relative shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-subtle text-body font-semibold text-accent">
        {username.slice(0, 1).toUpperCase()}
      </div>
      {presence && (
        <span
          className={cn(
            'absolute -bottom-1 -right-1 h-2 w-2 rounded-full border-2 border-base',
            presence === 'ingame' && 'bg-presence-ingame',
            presence === 'online' && 'bg-presence-online',
            presence === 'away' && 'bg-presence-away',
            presence === 'offline' && 'bg-presence-offline',
          )}
          aria-label={PRESENCE_LABEL[presence]}
        />
      )}
    </div>
  );
}

function ChatPanel({ friend, onClose }: { friend: FriendEntry; onClose: () => void }) {
  const uuid = friend.player.uuid;
  const { data } = useService(() => services.chat.list(uuid), [uuid]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) setMessages(data.messages);
  }, [data]);

  useWsPush((m) => {
    if (m.service !== 'chat' || m.method !== 'MessageReceived') return;
    const { uuid: tUuid, message } = m.input as { uuid: string; message: ChatMessage };
    if (tUuid !== uuid) return;
    setMessages((s) => (s.some((x) => x.id === message.id) ? s : [...s, message]));
  }, [uuid]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void services.chat.send(uuid, text).catch(() => toast.danger('Message failed'));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <Avatar username={friend.player.username} presence={friend.presence.state} />
        <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{friend.player.username}</span>
        <IconButton label="Close chat" icon={X} size="sm" onClick={onClose} />
      </div>
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-meta text-fg-tertiary">Say hi to {friend.player.username}.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'w-fit max-w-4/5 rounded-md px-2 py-1 text-body',
                m.from === 'self' ? 'self-end bg-accent-subtle text-fg' : 'self-start bg-base text-fg',
              )}
            >
              {m.text}
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-1 border-t border-border-subtle pt-2">
        <input
          type="text"
          value={draft}
          placeholder={`Message ${friend.player.username}`}
          aria-label={`Message ${friend.player.username}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          className="h-ctl-md w-full rounded-md border border-border bg-base px-3 text-body text-fg placeholder:text-fg-tertiary transition-colors duration-fast focus-ring enabled:hover:border-border-strong"
        />
        <IconButton label="Send" icon={Send} size="sm" disabled={!draft.trim()} onClick={send} />
      </div>
    </div>
  );
}

function FriendRow({ f, onRemove, onChat }: { f: FriendEntry; onRemove: (uuid: string, name: string) => void; onChat: (f: FriendEntry) => void }) {
  return (
    <div className="group flex items-center gap-3 border-b border-border-subtle px-4 py-2 last:border-b-0 transition-colors duration-fast hover:bg-hover">
      <Avatar username={f.player.username} presence={f.presence.state} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-fg">{f.player.username}</p>
        <p className="text-meta text-fg-tertiary">
          {f.presence.state === 'ingame' && f.presence.server ? `In game · ${f.presence.server}` : PRESENCE_LABEL[f.presence.state]}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
        <IconButton label={`Message ${f.player.username}`} icon={MessageSquare} size="sm" onClick={() => onChat(f)} />
        <IconButton label={`Remove ${f.player.username}`} icon={UserMinus} size="sm" onClick={() => onRemove(f.player.uuid, f.player.username)} />
      </div>
    </div>
  );
}

export function SocialScreen() {
  const { data: friendsData, loading, reload } = useService(() => services.friends.list(), []);
  const { data: requestsData, reload: reloadReq } = useService(() => services.friends.listRequests(), []);
  const [friends, setFriends] = useState<FriendEntry[]>();
  const [query, setQuery] = useState('');
  useWsPush(() => { reload(); reloadReq(); }, [reload, reloadReq]);

  const list = friends ?? friendsData ?? [];
  const requests = requestsData ?? [];
  const onlineCount = list.filter((f) => f.presence.state !== 'offline').length;

  const filtered = useMemo(
    () => list.filter((f) => f.player.username.toLowerCase().includes(query.toLowerCase())),
    [list, query],
  );

  const [chatWith, setChatWith] = useState<FriendEntry | null>(null);

  const remove = async (uuid: string, name: string) => {
    await services.friends.remove(uuid);
    setFriends((prev) => (prev ?? list).filter((f) => f.player.uuid !== uuid));
    toast.info(`${name} removed`, { duration: 2500 });
  };

  const [addName, setAddName] = useState('');
  const sendReq = async () => {
    const name = addName.trim();
    if (!name) return;
    try {
      await services.friends.sendRequest(name);
      toast.success(`Request sent to ${name}`, { duration: 2500 });
      setAddName('');
    } catch (e) {
      toast.warn(e instanceof Error ? e.message : String(e), { duration: 3000 });
    }
  };

  const actOn = async (uuid: string, name: string, accept: boolean) => {
    if (accept) await services.friends.accept(uuid);
    else await services.friends.decline(uuid);
    reloadReq();
    reload();
    (accept ? toast.success : toast.info)(accept ? `${name} added` : 'Request declined', { duration: 2500 });
  };

  return (
    <ScreenFrame
      title="Social"
      meta={`${onlineCount} of ${list.length} online`}
      actions={<SearchField value={query} onChange={setQuery} placeholder="Search friends" className="w-64" />}
    >
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col py-2">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} message={query ? `No friends matching "${query}".` : 'No friends yet - add someone to get started.'} action={{ label: 'Find players', icon: UserPlus, onClick: () => {} }} />
          ) : (
            filtered.map((f) => <FriendRow key={f.player.uuid} f={f} onRemove={remove} onChat={setChatWith} />)
          )}
        </div>
        <aside className="w-80 shrink-0 border-l border-border-subtle bg-elevated p-4">
          {chatWith ? (
            <ChatPanel friend={chatWith} onClose={() => setChatWith(null)} />
          ) : (
          <>
          <div className="mb-3 flex items-center gap-2">
            <SearchField
              value={addName}
              onChange={setAddName}
              onKeyDown={(e) => e.key === 'Enter' && void sendReq()}
              placeholder="Add by username"
              className="min-w-0 flex-1"
            />
            <IconButton label="Send friend request" icon={UserPlus} size="sm" onClick={() => void sendReq()} />
          </div>
          <h2 className="text-label font-semibold uppercase tracking-label text-fg-tertiary">Requests</h2>
          <div className="mt-2 flex flex-col gap-2">
            {requests.length === 0 ? (
              <p className="text-meta text-fg-tertiary">No pending requests.</p>
            ) : (
              requests.map((r) => (
                <div key={r.player.uuid} className="flex items-center gap-3 rounded-md border border-border bg-floating p-2">
                  <Avatar username={r.player.username} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-fg">{r.player.username}</p>
                    <p className="font-mono text-label tabular-nums text-fg-tertiary">
                      {new Date(r.at).toLocaleDateString()}
                    </p>
                  </div>
                  <IconButton label={`Accept ${r.player.username}`} icon={Check} size="sm" onClick={() => void actOn(r.player.uuid, r.player.username, true)} />
                  <IconButton label={`Decline ${r.player.username}`} icon={X} size="sm" onClick={() => void actOn(r.player.uuid, r.player.username, false)} />
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-md border border-border-subtle bg-base p-3">
            <div className="flex items-center gap-2">
              <Icon icon={Users} className="text-fg-tertiary" />
              <span className="text-body font-medium text-fg">Group chat</span>
              <Badge>soon</Badge>
            </div>
            <p className="mt-1 text-meta text-fg-tertiary">Party and group chat windows land with the social backend.</p>
          </div>
          </>
          )}
        </aside>
      </div>
    </ScreenFrame>
  );
}
