import { useState } from 'react';
import { socket } from '../socket.js';
import { useStore } from '../store.js';
import { NUM_PLAYERS } from '@bluff-auction/shared';

export function Lobby() {
  const view = useStore((s) => s.view);
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const playerCount = view ? (view.self ? 1 : 0) + view.others.length : 0;

  const handleJoin = () => {
    if (!name.trim()) return;
    socket.emit('join-room', { name }, (res) => {
      if (res.ok) setJoined(true);
      else alert(`参加失敗: ${res.message}`);
    });
  };

  const handleStart = () => {
    socket.emit('start-game', (res) => {
      if (!res.ok) alert(`開始失敗: ${res.message}`);
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Bluff Auction</h1>
      <h2>ロビー</h2>

      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, fontSize: 16 }}
          />
          <button onClick={handleJoin} style={{ marginLeft: 8, padding: 8 }}>
            参加
          </button>
        </div>
      ) : (
        <div>参加済み: {name}</div>
      )}

      <h3>参加者 ({playerCount}/{NUM_PLAYERS})</h3>
      <ul>
        {view?.self && <li>{view.self.name}(自分)</li>}
        {view?.others.map((p) => <li key={p.id}>{p.name}</li>)}
      </ul>

      {joined && playerCount === NUM_PLAYERS && (
        <button onClick={handleStart} style={{ padding: 12, fontSize: 16 }}>
          ゲーム開始
        </button>
      )}
    </div>
  );
}
