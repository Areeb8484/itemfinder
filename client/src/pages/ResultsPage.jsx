import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../utils/SocketContext.jsx';
import { useGame } from '../utils/GameContext.jsx';

// ResultsPage displays the final standings at the end of a game. The
// top three players are highlighted with ordinal numbers. Players can
// choose to play again with the same group or return to the home page.
const ResultsPage = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const {
    standings,
    roomCode,
    setStandings,
    setPlayers,
    setHostId,
    setUsername,
    setRoomCode
  } = useGame();

  const handlePlayAgain = () => {
    // Ask the server to reset the room for a new game
    if (socket) {
      socket.emit('playAgain', { roomCode });
    }
    // After resetting, go back to the lobby to wait for the host to start
    navigate('/lobby');
  };

  const handleLeave = () => {
    // Disconnect the socket to leave the room entirely
    if (socket) {
      socket.disconnect();
    }
    // Reset local state
    setStandings([]);
    setPlayers([]);
    setHostId('');
    setRoomCode('');
    setUsername('');
    navigate('/');
    // Force reload to establish a new socket connection on the next game
    window.location.reload();
  };

  // Determine podium positions and winner
  const winner = standings[0];
  const podiumEmojis = ['🥇', '🥈', '🥉'];
  const celebrationEmojis = ['🎉', '🌟', '✨', '🏆', '🎊'];

  // Cheerful styling matching the app theme
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81, #1e3a8a)',
    color: '#fff',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: 40,
    animation: 'fadeInDown 0.8s ease-out'
  };

  const titleStyle = {
    fontSize: 48,
    fontWeight: 800,
    margin: '0 0 8px',
    background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
  };

  const subtitleStyle = {
    fontSize: 18,
    opacity: 0.8,
    margin: 0
  };

  const podiumStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'end',
    gap: 20,
    marginBottom: 40,
    flexWrap: 'wrap'
  };

  const podiumItemStyle = (place) => ({
    background: place === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
               : place === 1 ? 'linear-gradient(135deg, #e5e7eb, #9ca3af)'
               : 'linear-gradient(135deg, #cd7c2f, #92400e)',
    borderRadius: 20,
    padding: '20px 24px',
    textAlign: 'center',
    minWidth: 140,
    height: place === 0 ? 180 : place === 1 ? 160 : 140,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    transform: place === 0 ? 'scale(1.1)' : 'scale(1)',
    animation: `bounceIn 0.6s ease-out ${place * 0.2}s both`
  });

  const standingsStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 500,
    backdropFilter: 'blur(8px)'
  };

  const standingItemStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    marginBottom: index === standings.length - 1 ? 0 : 8,
    background: index < 3 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
  });

  const buttonsStyle = {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const buttonStyle = {
    padding: '16px 24px',
    borderRadius: 16,
    border: 'none',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    minWidth: 160,
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(90deg, #10b981, #059669)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)'
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Game Complete! {celebrationEmojis[0]}</h1>
        <p style={subtitleStyle}>Congratulations to all players! {celebrationEmojis[1]}</p>
      </div>

      {/* Top 3 Podium */}
      {standings.length > 0 && (
        <div style={podiumStyle}>
          {standings.slice(0, 3).map((player, index) => (
            <div key={player.username} style={podiumItemStyle(index)}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{podiumEmojis[index]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: index === 0 ? '#000' : '#fff', marginBottom: 4 }}>
                {player.username}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: index === 0 ? '#000' : '#fff' }}>
                {player.score} pts
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Standings */}
      <div style={standingsStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 20, textAlign: 'center' }}>Final Standings</h3>
        {standings.map((player, index) => (
          <div key={player.username} style={standingItemStyle(index)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: index < 3 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(96,165,250,0.25)',
                color: index < 3 ? '#000' : '#fff',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700
              }}>
                {index + 1}
              </span>
              <span style={{ fontWeight: 600 }}>{player.username}</span>
            </span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{player.score} pts</span>
          </div>
        ))}
      </div>

      <div style={buttonsStyle}>
        <button onClick={handlePlayAgain} style={primaryButtonStyle}>
          🎮 Play Again
        </button>
        <button onClick={handleLeave} style={secondaryButtonStyle}>
          🏠 Leave to Homepage
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;