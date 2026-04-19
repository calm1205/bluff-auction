import { useEffect } from 'react';
import { socket } from './socket.js';
import { useStore } from './store.js';
import { Lobby } from './components/Lobby.js';
import { GameBoard } from './components/GameBoard.js';

export function App() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const setRevealed = useStore((s) => s.setRevealed);
  const setWinner = useStore((s) => s.setWinner);
  const setError = useStore((s) => s.setError);

  useEffect(() => {
    socket.on('view-update', (v) => setView(v));
    socket.on('auction-revealed', (r) => setRevealed(r));
    socket.on('game-ended', (p) => setWinner(p.winnerId));
    socket.on('unsold-penalty', (p) => {
      console.log('[unsold-penalty]', p);
    });
    socket.on('error-event', (e) => setError(e.message));

    return () => {
      socket.off('view-update');
      socket.off('auction-revealed');
      socket.off('game-ended');
      socket.off('unsold-penalty');
      socket.off('error-event');
    };
  }, [setView, setRevealed, setWinner, setError]);

  return view?.phase === 'lobby' || !view ? <Lobby /> : <GameBoard />;
}
