import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { LiveBadge } from './components/LiveBadge';
import { IndexView } from './views/IndexView';
import { BotView } from './views/BotView';
import type { WsMessage } from './types';

type Route = { view: 'index' } | { view: 'bot'; bot: string };

function getRoute(): Route {
  const h = location.hash.replace(/^#/, '') || '/';
  if (h.startsWith('/bot/')) return { view: 'bot', bot: decodeURIComponent(h.slice(5)) };
  return { view: 'index' };
}

function useHashRoute() {
  const [route, setRoute] = useState<Route>(getRoute);

  const handleNavigate = useCallback((path: string) => {
    location.hash = '#' + path;
    setRoute(getRoute());
  }, []);

  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return { route, handleNavigate };
}

export function App() {
  const { route, handleNavigate } = useHashRoute();
  const [liveSignal, setLiveSignal] = useState(0);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleWsMessage = useCallback((_msg: WsMessage) => {
    setLiveSignal(n => n + 1);
    setRefreshSignal(n => n + 1);
  }, []);

  useWebSocket(handleWsMessage);

  return (
    <>
      {route.view === 'index' && (
        <IndexView onNavigate={handleNavigate} refreshSignal={refreshSignal} />
      )}
      {route.view === 'bot' && (
        <BotView key={route.bot} botName={route.bot} onNavigate={handleNavigate} refreshSignal={refreshSignal} />
      )}
      <LiveBadge trigger={liveSignal} />
    </>
  );
}
