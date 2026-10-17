# Korvex Launcher - Frontend

The standalone UI for the Korvex Minecraft launcher. Everything runs on a
built-in mock backend, so you can develop every screen without the game,
server, mods or any credentials.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173 - every screen is live and populated with
fixture data (players, friends, cosmetics, versions, servers, chat).

## Layout

| Path | What |
| ---- | ---- |
| `launcher/` | The React + Vite + Tailwind app (`src/screens`, `src/shell`, `src/services`) |
| `shared/` | `@korvex/ui` component library consumed via a workspace dep |

## Mock backend

`launcher/src/ws/client.ts` picks `MockWsClient` whenever `VITE_WS_URL` is
unset; `launcher/src/services/index.ts` registers every RPC + push event on
fixture data (`fixtures.ts`). Tests force the mock too (`vitest.config.ts`).
Copy `.env.example` to `.env` and set `VITE_WS_URL` only if you want to point
the UI at a real websocket backend.

- `npm run test` - vitest suite (services + ws client)
- `npm run build` - typecheck + production bundle
