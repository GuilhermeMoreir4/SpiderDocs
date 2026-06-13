import { useEffect, useRef } from 'react';
import type { WsMessage } from '../types';

export function useWebSocket(onMessage: (msg: WsMessage) => void): void {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/live`);
      ws.onmessage = (e) => {
        try {
          cbRef.current(JSON.parse(e.data) as WsMessage);
        } catch {}
      };
      ws.onclose = () => { if (!destroyed) setTimeout(connect, 2000); };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      destroyed = true;
      ws?.close();
    };
  }, []);
}
