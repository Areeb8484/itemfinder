import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../utils/SocketContext.jsx';
import { useGame } from '../utils/GameContext.jsx';

// Clean minimal lobby after corruption.
const LobbyPage = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { roomCode, players, setPlayers, hostId, setHostId, difficulty, rounds } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleRoomUpdate = ({ players, hostId }) => {
      setPlayers(players);
      setHostId(hostId);
    };
    const handleRoundStart = () => navigate('/game');
    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('roundStart', handleRoundStart);
    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
      socket.off('roundStart', handleRoundStart);
    };
  }, [socket, navigate, setPlayers, setHostId]);

  const isHost = socket && socket.id === hostId;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    } catch(e){
      console.log('Copy failed');
    }
  };

  const startGame = () => {
    if (socket) socket.emit('startGame', { roomCode });
  };

  return (
    <div style={{minHeight:'100vh',padding:'1.5rem',background:'linear-gradient(135deg,#1e1b4b,#1e3a8a,#312e81)',color:'#fff'}}>
      <div style={{maxWidth:700,margin:'0 auto'}}>
        <h1 style={{textAlign:'center',fontSize:'2.2rem',fontWeight:700,marginBottom:24}}>Game Lobby</h1>
        <div style={{display:'grid',gap:24}}>
          <div style={{background:'rgba(255,255,255,0.08)',padding:20,borderRadius:20,border:'1px solid rgba(255,255,255,0.15)',textAlign:'center'}}>
            <h2 style={{fontSize:14,letterSpacing:1,textTransform:'uppercase',opacity:.8,marginBottom:8}}>Room Code</h2>
            <div style={{fontFamily:'monospace',fontSize:40,letterSpacing:6,marginBottom:16}}>{roomCode}</div>
            <button onClick={copyCode} style={{padding:'10px 18px',borderRadius:14,border:'1px solid rgba(255,255,255,0.25)',background:copied?'rgba(34,197,94,0.25)':'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,cursor:'pointer',width:'100%'}}>{copied?'Copied!':'Copy Code'}</button>
          </div>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            <div style={{flex:'1 1 240px',background:'rgba(255,255,255,0.08)',padding:20,borderRadius:20,border:'1px solid rgba(255,255,255,0.15)'}}>
              <h3 style={{fontSize:16,marginBottom:12,opacity:.85}}>Game Settings</h3>
              <p style={{margin:'4px 0'}}>Difficulty: <strong style={{textTransform:'capitalize'}}>{difficulty}</strong></p>
              <p style={{margin:'4px 0'}}>Rounds: <strong>{rounds}</strong></p>
            </div>
            <div style={{flex:'2 1 300px',background:'rgba(255,255,255,0.08)',padding:20,borderRadius:20,border:'1px solid rgba(255,255,255,0.15)'}}>
              <h3 style={{fontSize:16,marginBottom:12,opacity:.85}}>Players ({players.length})</h3>
              <ul style={{listStyle:'none',margin:0,padding:0,display:'grid',gap:8,maxHeight:220,overflowY:'auto'}}>
                {players.map((p,i)=> (
                  <li key={p.id || p.username} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(255,255,255,0.07)',padding:'10px 14px',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)'}}>
                    <span style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',background: p.id===hostId ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(96,165,250,0.25)',color:'#fff',borderRadius:12,fontSize:14,fontWeight:700}}>{i+1}</span>
                      <span style={{fontWeight:500}}>{p.username}</span>
                    </span>
                    {p.id===hostId && <span style={{fontSize:12,padding:'4px 8px',background:'linear-gradient(90deg,#9333ea,#3b82f6)',borderRadius:20,fontWeight:600}}>Host</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            {isHost ? (
              <button onClick={startGame} disabled={players.length<1} style={{padding:'16px 26px',borderRadius:18,border:'none',background: players.length<1? 'rgba(255,255,255,0.2)' : 'linear-gradient(90deg,#10b981,#059669)',color:'#fff',fontSize:18,fontWeight:600,cursor: players.length<1? 'not-allowed':'pointer',width:'100%'}}>
                Start Game
              </button>
            ) : (
              <p style={{opacity:.7}}>Waiting for host to start…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;