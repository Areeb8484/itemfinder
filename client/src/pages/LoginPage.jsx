import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../utils/SocketContext.jsx';
import { useGame } from '../utils/GameContext.jsx';

// FINAL CLEAN FILE: Do not append any code below this component.
const LoginPage = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { setUsername, setRoomCode, setPlayers, setHostId, setDifficulty, setRounds } = useGame();

  const [username, setUsernameInput] = useState('');
  const [roomCode, setRoomCodeInput] = useState('');
  const [difficulty, setDifficultyLocal] = useState('easy');
  const [roundsLocal, setRoundsLocal] = useState(3);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const emit = (event, payload, cb) => socket && socket.emit(event, payload, cb);

  const handleCreate = () => {
    if (!username.trim()) return setError('Enter username');
    setError('');
    emit('createRoom', { username: username.trim(), difficulty, rounds: roundsLocal }, ({ roomCode, room, error }) => {
      if (error) return setError(error);
      setUsername(username.trim());
      setRoomCode(roomCode);
      setPlayers(room.players);
      setHostId(room.hostId);
      setDifficulty(room.difficulty);
      setRounds(room.rounds);
      navigate('/lobby');
    });
  };

  const handleJoin = () => {
    if (!username.trim()) return setError('Enter username');
    if (roomCode.trim().length !== 6) return setError('6-char code');
    setError('');
    const code = roomCode.trim().toUpperCase();
    emit('joinRoom', { username: username.trim(), roomCode: code }, ({ room, error }) => {
      if (error) return setError(error);
      setUsername(username.trim());
      setRoomCode(code);
      setPlayers(room.players);
      setHostId(room.hostId);
      setDifficulty(room.difficulty);
      setRounds(room.rounds);
      navigate('/lobby');
    });
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1e1b4b',padding:24,color:'#fff',fontFamily:'system-ui, sans-serif'}}>
      <div style={{width:'100%',maxWidth:380}}>
        <h1 style={{textAlign:'center',margin:'0 0 24px',fontSize:32,fontWeight:700}}>ItemFinder</h1>
        <div style={{background:'rgba(255,255,255,0.08)',padding:20,borderRadius:18,border:'1px solid rgba(255,255,255,0.15)'}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Username</label>
          <input value={username} onChange={e=>setUsernameInput(e.target.value)} maxLength={20} placeholder='Your name' style={{width:'100%',padding:'10px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.12)',color:'#fff',marginBottom:16}} />
          {!joining && (
            <>
              <div style={{display:'flex',gap:8,marginBottom:14}}>
                {['easy','medium','hard'].map(d => (
                  <button key={d} onClick={()=>setDifficultyLocal(d)} style={{flex:1,padding:'10px 0',borderRadius:10,border:`2px solid ${difficulty===d?'#60a5fa':'rgba(255,255,255,0.25)'}`,background:difficulty===d?'rgba(96,165,250,0.3)':'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,textTransform:'capitalize',cursor:'pointer'}}>{d}</button>
                ))}
              </div>
              <label style={{display:'block',fontSize:12,opacity:.8,marginBottom:4}}>Rounds: {roundsLocal}</label>
              <input type='range' min={3} max={10} value={roundsLocal} onChange={e=>setRoundsLocal(parseInt(e.target.value))} style={{width:'100%',marginBottom:16}} />
              <button onClick={handleCreate} style={{width:'100%',padding:'12px 16px',border:'none',borderRadius:14,background:'linear-gradient(90deg,#3b82f6,#9333ea)',color:'#fff',fontWeight:600,marginBottom:12,cursor:'pointer'}}>Create Game</button>
              <button onClick={()=>setJoining(true)} style={{width:'100%',padding:'12px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:600,cursor:'pointer'}}>Join Game</button>
            </>
          )}
          {joining && (
            <div>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Room Code</label>
              <input value={roomCode} onChange={e=>setRoomCodeInput(e.target.value.toUpperCase())} maxLength={6} placeholder='ABC123' style={{width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.12)',color:'#fff',fontSize:22,letterSpacing:6,textAlign:'center',marginBottom:14,fontFamily:'monospace'}} />
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setJoining(false)} style={{flex:1,padding:'10px 0',borderRadius:12,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,cursor:'pointer'}}>Back</button>
                <button onClick={handleJoin} style={{flex:1,padding:'10px 0',borderRadius:12,border:'none',background:'linear-gradient(90deg,#3b82f6,#9333ea)',color:'#fff',fontWeight:600,cursor:'pointer'}}>Join</button>
              </div>
            </div>
          )}
          {error && <div style={{marginTop:12,padding:'8px 12px',background:'rgba(239,68,68,0.22)',border:'1px solid rgba(239,68,68,0.45)',borderRadius:10,color:'#fecaca',fontSize:13}}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;