import React, { useEffect, useState } from 'react';
import { useSocket } from '../utils/SocketContext.jsx';
import { useGame } from '../utils/GameContext.jsx';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture.jsx';

// The GamePage handles the main gameplay loop. It listens for round
// events from the server, displays prompts and timers, allows the user
// to capture or upload a photo, and shows per‑round results and the
// running scoreboard. When the final results are received it navigates
// to the results page.
const GamePage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const {
    roomCode,
    players,
    setPlayers,
    setStandings
  } = useGame();
  const [prompt, setPrompt] = useState('');
  const [roundInfo, setRoundInfo] = useState({ round: 0, total: 0 });
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingState, setLoadingState] = useState(true); // shows spinner until first round fetched
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [submissionMsg, setSubmissionMsg] = useState('');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // --- Socket event handlers ---
    const handleRoundStart = (data) => {
      setPrompt(data.prompt);
      setRoundInfo({ round: data.round, total: data.totalRounds });
      setEndTime(data.endTime);
      setSubmitted(false);
      setSelectedImage(null);
      setResults(null);
      setSubmissionMsg('');
      setLoadingState(false); // ensure loading cleared when first round arrives
      setWaitingForStart(false);
    };

    const handleRoundResult = (data) => {
      setResults(data);
      if (data.results) {
        // Use functional update to avoid stale closure over players
        setPlayers(prev => prev.map(p => {
          const r = data.results.find(x => x.username === p.username);
          return r ? { ...p, score: r.score } : p;
        }));
      }
    };

    const handleFinalResult = (data) => {
      setStandings(data.standings);
      navigate('/results');
    };

    const handleSubmissionReceived = ({ correct, confidence, reason }) => {
      if (correct) {
        setSubmissionMsg(`Accepted ✓  ${(confidence!=null?Math.round(confidence*100):'--')}%  ${reason||''}`);
      } else {
        setSubmissionMsg(`Not a match ✗ ${(confidence!=null?Math.round(confidence*100):'--')}%  ${reason||''}`);
      }
    };

    socket.on('roundStart', handleRoundStart);
    socket.on('roundResult', handleRoundResult);
    socket.on('finalResult', handleFinalResult);
    socket.on('submissionReceived', handleSubmissionReceived);

    // --- Immediate current state request (fix for late navigation) ---
    let responded = false;
    socket.emit('getCurrentState', { roomCode }, (data) => {
      responded = true;
      console.debug('[getCurrentState callback]', data);
      if (data) {
        if (data.status === 'playing') {
          setPrompt(data.prompt);
          setRoundInfo({ round: data.round, total: data.totalRounds });
          setEndTime(data.endTime);
          setWaitingForStart(false);
        } else if (data.status === 'waiting') {
          setWaitingForStart(true);
        }
      }
      setLoadingState(false);
    });

    // Fallback timeout
    const timeoutId = setTimeout(() => {
      if (!responded) {
        console.warn('getCurrentState did not respond in time');
        setLoadingState(false);
        setWaitingForStart(true);
      }
    }, 2500);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      socket.off('roundStart', handleRoundStart);
      socket.off('roundResult', handleRoundResult);
      socket.off('finalResult', handleFinalResult);
      socket.off('submissionReceived', handleSubmissionReceived);
    };
  }, [socket, roomCode, setPlayers, setStandings, navigate]);

  // Update the countdown timer
  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, endTime - Date.now());
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [endTime]);

  // Fallback file input handler (in case camera not available / permission denied)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedImage || submitted) return;
    setSubmitted(true);
    socket.emit('submitPhoto', { roomCode, image: selectedImage });
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Basic styling upgrade (inline to avoid relying on Tailwind right now)
  const containerStyle = { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', color: '#fff', padding: '20px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' };
  const headerStyle = { textAlign: 'center', marginBottom: 20 };
  const promptCardStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, backdropFilter: 'blur(6px)' };
  const timerStyle = { fontSize: 28, fontWeight: 600, letterSpacing: 1, textAlign: 'center', margin: '8px 0 16px' };
  const flexWrap = { display: 'flex', gap: 20, flexWrap: 'wrap' };
  const col = { flex: '1 1 340px', minWidth: 300 };
  const card = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, marginBottom: 20 };
  const buttonPrimary = { background: 'linear-gradient(90deg,#3b82f6,#9333ea)', border: 'none', color: '#fff', fontWeight: 600, padding: '12px 16px', width: '100%', borderRadius: 12, cursor: 'pointer', marginTop: 12 };
  const buttonDisabled = { ...buttonPrimary, opacity: 0.4, cursor: 'not-allowed' };
  const imagePreview = { maxWidth: '100%', maxHeight: 240, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{fontSize:34, margin:'0 0 4px'}}>ItemFinder</h1>
        <p style={{opacity:0.7, fontSize:14}}>Room {roomCode}</p>
      </div>
      {loadingState ? (
        <div style={{textAlign:'center', marginTop:60}}>Loading current round…</div>
      ) : (
        <>
          {waitingForStart && !prompt && roundInfo.round === 0 && (
            <div style={{textAlign:'center', opacity:0.7, fontSize:16, marginBottom:20}}>Waiting for host to start the game…</div>
          )}
          {(roundInfo.round > 0 || prompt) && (
            <div style={promptCardStyle}>
              {roundInfo.round > 0 && <h2 style={{margin:'0 0 6px'}}>Round {roundInfo.round} / {roundInfo.total}</h2>}
              {prompt && <p style={{fontSize:18, fontWeight:600, margin:'4px 0 0'}}>{prompt}</p>}
              {endTime && <div style={timerStyle}>{formatTime(timeLeft)}</div>}
            </div>
          )}
          <div style={flexWrap}>
            <div style={col}>
              {!results ? (
                <div style={card}>
                  <h3 style={{marginTop:0}}>Your Submission</h3>
                  {!selectedImage && (
                    <>
                      <CameraCapture
                        onCapture={(data) => { setSelectedImage(data); setCameraError(null); }}
                        onError={(err) => setCameraError(err.message || 'Camera unavailable')}
                      />
                      {cameraError && (
                        <div style={{marginTop:10, fontSize:13, color:'#f87171'}}>
                          {cameraError}. You can still upload a file below.
                        </div>
                      )}
                    </>
                  )}
                  {selectedImage && (
                    <div>
                      <img src={selectedImage} alt="preview" style={imagePreview} />
                      {!submitted && (
                        <div style={{marginTop:12}}>
                          <button onClick={()=>{setSelectedImage(null);setCameraError(null);}} style={{...buttonPrimary, background:'rgba(255,255,255,0.15)', marginBottom:8}}>Retake Photo</button>
                        </div>
                      )}
                    </div>
                  )}
                  {!submitted && (
                    <>
                      {!selectedImage && (
                        <div style={{marginTop:14}}>
                          <input type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                      )}
                      <button onClick={handleSubmit} style={!selectedImage ? buttonDisabled : buttonPrimary} disabled={!selectedImage || submitted}>Submit Photo</button>
                    </>
                  )}
                  {submissionMsg && <p style={{marginTop:12, fontSize:14}}>{submissionMsg}</p>}
                </div>
              ) : (
                <div style={card}>
                  <h3 style={{marginTop:0}}>Round Results</h3>
                  <ul style={{paddingLeft:18, margin:'8px 0'}}>
                    {results.results.map((r, idx) => (
                      <li key={idx} style={{marginBottom:4}}>
                        <strong>{r.username}</strong>: {r.correct ? '✅' : '❌'} – {r.timeTaken !== Infinity ? `${(r.timeTaken/1000).toFixed(1)}s` : 'No Submission'} – Score {r.score}
                      </li>
                    ))}
                  </ul>
                  <p style={{opacity:0.7, fontSize:13}}>Next round starting…</p>
                </div>
              )}
            </div>
            <div style={col}>
              <div style={card}>
                <h3 style={{marginTop:0}}>Leaderboard</h3>
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                  {players.slice().sort((a,b)=>b.score-a.score).map((p,i)=>(
                    <li key={p.id || p.username} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      <span>{i+1}. {p.username}</span>
                      <span style={{fontWeight:600}}>{p.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GamePage;