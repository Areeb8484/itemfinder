import React, { createContext, useContext, useState } from 'react';

// This context holds game state that spans multiple pages. When a user
// creates or joins a room we store their username, the room code and
// current player list here. Scores and standings are also tracked so
// they can be displayed across components. See pages/LoginPage.jsx
// and pages/ResultsPage.jsx for usage examples.

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [rounds, setRounds] = useState(3);
  const [standings, setStandings] = useState([]);
  return (
    <GameContext.Provider
      value={{
        username,
        setUsername,
        roomCode,
        setRoomCode,
        players,
        setPlayers,
        hostId,
        setHostId,
        difficulty,
        setDifficulty,
        rounds,
        setRounds,
        standings,
        setStandings
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  return useContext(GameContext);
};