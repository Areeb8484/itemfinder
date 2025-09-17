import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import GamePage from './pages/GamePage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import { SocketProvider } from './utils/SocketContext.jsx';
import { GameProvider } from './utils/GameContext.jsx';

// Top‑level component that wires together routing and context providers. The
// SocketProvider initialises the Socket.IO connection and makes it
// available throughout the component tree. GameProvider stores
// cross‑page state such as the current room code, players and scores.
function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;