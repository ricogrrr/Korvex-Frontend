import { useEffect, useState } from 'react';
import { Skeleton, UIProvider } from '@korvex/ui';
import { Titlebar } from './shell/Titlebar';
import { IconRail } from './shell/IconRail';
import { routeFromHash, type ScreenId } from './shell/screens';
import { HomeScreen } from './screens/HomeScreen';
import { VersionsScreen } from './screens/VersionsScreen';
import { ModsScreen } from './screens/ModsScreen';
import { CosmeticsScreen } from './screens/CosmeticsScreen';
import { SocialScreen } from './screens/SocialScreen';
import { StoreScreen } from './screens/StoreScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ServersScreen } from './screens/ServersScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import { DevPage } from './dev/DevPage';
import { services } from './services';
import { wsClient, MockWsClient } from './ws/client';

/* Mock client serves a fixture profile immediately - no login gate needed. */
const realWs = !(wsClient instanceof MockWsClient);

function Screen({ id }: { id: ScreenId }) {
  switch (id) {
    case 'home': return <HomeScreen />;
    case 'versions': return <VersionsScreen />;
    case 'servers': return <ServersScreen />;
    case 'profile': return <ProfileScreen />;
    case 'mods': return <ModsScreen />;
    case 'cosmetics': return <CosmeticsScreen />;
    case 'social': return <SocialScreen />;
    case 'store': return <StoreScreen />;
    case 'settings': return <SettingsScreen />;
    case 'dev': return <DevPage />;
  }
}

export function App() {
  const [screen, setScreen] = useState<ScreenId>(() => routeFromHash(window.location.hash));
  const [auth, setAuth] = useState<'check' | 'ready' | 'login'>(realWs ? 'check' : 'ready');

  useEffect(() => {
    const onHash = () => setScreen(routeFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* Real backend: no usable session token -> the server answers every
     non-auth call with 'unauthenticated', which routes here. */
  useEffect(() => {
    if (!realWs) return;
    void services.user.getProfile().then(
      () => setAuth('ready'),
      () => setAuth('login'),
    );
  }, []);

  const navigate = (id: ScreenId) => {
    window.location.hash = `/${id}`;
    setScreen(id);
  };

  return (
    <UIProvider>
      <div className="flex h-full flex-col bg-base text-fg">
        <Titlebar />
        {auth === 'check' ? (
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : auth === 'login' ? (
          <LoginScreen />
        ) : (
          <div className="flex min-h-0 flex-1">
            <IconRail active={screen} onNavigate={navigate} />
            <main className="flex min-w-0 flex-1">
              <Screen id={screen} />
            </main>
          </div>
        )}
      </div>
    </UIProvider>
  );
}
