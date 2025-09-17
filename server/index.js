/*
 * Main entry point for the ItemFinder game backend. This server
 * exposes a small REST API for health checks and AI validation
 * endpoint, and uses Socket.IO to manage real‑time multiplayer rooms.
 *
 * The game logic lives inside the connection handler below. Rooms are
 * stored in memory and removed when the last player disconnects. For
 * production use you may wish to persist room state to a database.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const prompts = require('./data/prompts');
// Gemini AI (optional) integration
let genAI = null;
let geminiTextModel = null;
let geminiVisionModel = null;
const GEMINI_ENABLED = !!process.env.GEMINI_API_KEY;
if (GEMINI_ENABLED) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Fast model for both text list generation and simple vision matching
    geminiTextModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    geminiVisionModel = geminiTextModel; // flash supports image + text
    console.log('[Gemini] Enabled');
  } catch (err) {
    console.warn('[Gemini] Failed to initialize, falling back to static prompts.', err.message);
  }
}

// Utility: timeout wrapper to avoid hanging game flow if AI is slow
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timeout')), ms))
  ]);
}

// AI Prompt Generation: produce N concise photo challenge missions based on difficulty.
async function aiGeneratePrompts(difficulty, count) {
  if (!GEMINI_ENABLED || !geminiTextModel) throw new Error('Gemini disabled');
  const difficultySpec = {
    easy: 'single common everyday objects (e.g. red mug, pair of sunglasses, a spoon).',
    medium: 'objects in a simple context or light action (e.g. an open book on a table, a shoe next to a bottle of water).',
    hard: 'multi‑step, abstract or combined concepts requiring creativity (e.g. shadow shaped like an animal, reflection in a mirror including a plant).'
  }[difficulty] || 'simple objects';
  const prompt = `Generate ${count} distinct photo challenge missions for a scavenger hunt style game. Difficulty: ${difficulty} meaning ${difficultySpec}
Rules:
- Each mission MUST be <= 12 words.
- No numbering, bullet points, or extra commentary.
- Avoid unsafe or private scenarios. Keep it family friendly.
- Return as a raw list separated by newlines ONLY.`;
  const result = await withTimeout(geminiTextModel.generateContent(prompt), 6000, 'prompt generation');
  const text = result.response.text().trim();
  const lines = text.split(/\n+/).map(l => l.replace(/^[-*0-9.()\s]+/, '').trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('No prompts returned');
  return lines.slice(0, count);
}

// AI Image Validation: ask the model if the image matches the mission.
async function aiValidateImage(base64DataUrl, mission) {
  if (!GEMINI_ENABLED || !geminiVisionModel) {
    // Fallback random simulation (legacy behavior)
    return { valid: Math.random() < 0.7, confidence: Math.round(Math.random() * 100) / 100, reason: 'Simulated (AI off)' };
  }
  // Extract base64 payload
  const match = base64DataUrl.match(/^data:(?:image\/\w+);base64,(.+)$/);
  if (!match) {
    return { valid: false, confidence: 0, reason: 'Invalid image data' };
  }
  const b64 = match[1];
  const systemInstruction = `You judge if a player photo satisfies a scavenger hunt mission. Respond ONLY with strict JSON {"valid": boolean, "confidence": number 0-1, "reason": string <= 60 chars}. Consider obvious match vs. clear mismatch. Be slightly lenient.`;
  const userPrompt = `Mission: "${mission}"\nDecide if the image satisfies the mission.`;
  try {
    const resp = await withTimeout(geminiVisionModel.generateContent({
      contents: [
        { role: 'user', parts: [ { text: systemInstruction } ] },
        { role: 'user', parts: [ { text: userPrompt }, { inlineData: { mimeType: 'image/jpeg', data: b64 } } ] }
      ]
    }), 6500, 'image validation');
    const text = resp.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    let parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.valid !== 'boolean') throw new Error('Missing valid');
    const confidence = typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5;
    return { valid: parsed.valid, confidence, reason: parsed.reason || 'AI evaluated' };
  } catch (err) {
    console.warn('[Gemini] validation fallback:', err.message);
    return { valid: Math.random() < 0.7, confidence: Math.round(Math.random() * 100) / 100, reason: 'Fallback (error)' };
  }
}

// Helper to generate a unique 6‑character alphanumeric room code. This is
// sufficient for small numbers of concurrent rooms; collisions are unlikely
// but we loop until a unique code is found just in case.
function generateRoomCode(existing) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existing[code]);
  return code;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
// Configure CORS using environment variable. Multiple origins can be
// specified with a comma. If none provided, allow all origins (not
// recommended for production).
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

// Simple health check endpoint. Useful for load balancers and uptime monitors.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mock AI validation endpoint. In a production environment you could
// integrate with the Gemini API or another vision model here. For
// development we return a random true/false and a confidence score.
app.post('/api/validate', (req, res) => {
  const { image, prompt } = req.body;
  // Basic validation of input parameters
  if (!image || !prompt) {
    return res.status(400).json({ error: 'image and prompt are required' });
  }
  // Simulate processing time with a short delay
  setTimeout(() => {
    const valid = Math.random() < 0.7;
    const confidence = Math.round(Math.random() * 100) / 100;
    res.json({ valid, confidence });
  }, 500);
});

// Create the HTTP server and Socket.IO server on top of it. Socket.IO
// automatically attaches event listeners to the HTTP server and handles
// WebSocket upgrades for us.
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'POST']
  }
});

// In‑memory store of active rooms. Each key is a room code pointing to
// an object with room metadata and player information. When the last
// player leaves the room is deleted.
const rooms = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  /**
   * Event: createRoom
   * Payload: { username, difficulty, rounds }
   * A player calls this to create a new game room. The server generates
   * a unique code, registers the creator as the host and first player
   * and returns the initial room state via the callback.
   */
  socket.on('createRoom', ({ username, difficulty, rounds }, callback) => {
    if (typeof username !== 'string' || !username.trim()) {
      return callback({ error: 'Invalid username' });
    }
    const diff = (difficulty || 'easy').toLowerCase();
    const totalRounds = parseInt(rounds, 10);
    if (!['easy', 'medium', 'hard'].includes(diff)) {
      return callback({ error: 'Invalid difficulty' });
    }
    if (![3, 5, 7, 10].includes(totalRounds)) {
      return callback({ error: 'Invalid number of rounds' });
    }
    const roomCode = generateRoomCode(rooms);
    const room = {
      code: roomCode,
      hostId: socket.id,
      difficulty: diff,
      rounds: totalRounds,
      players: [],
      status: 'waiting',
      currentRound: 0,
      prompts: [],
      submissions: {},
      startTime: null,
      scores: {}
    };
    const player = { id: socket.id, username: username.trim(), score: 0 };
    room.players.push(player);
    room.scores[socket.id] = 0;
    rooms[roomCode] = room;
    socket.join(roomCode);
    // Send room info back to creator
    callback({ roomCode, room });
    // Broadcast the new player list to the room
    io.to(roomCode).emit('roomUpdate', { players: room.players, hostId: room.hostId });
  });

  /**
   * Event: joinRoom
   * Payload: { username, roomCode }
   * A player calls this to join an existing room. The server checks that
   * the room exists and has capacity. It then adds the player and
   * notifies all clients of the new state.
   */
  socket.on('joinRoom', ({ username, roomCode }, callback) => {
    const code = (roomCode || '').toUpperCase();
    const room = rooms[code];
    if (!room) {
      return callback({ error: 'Room not found' });
    }
    if (room.players.length >= 8) {
      return callback({ error: 'Room is full' });
    }
    if (typeof username !== 'string' || !username.trim()) {
      return callback({ error: 'Invalid username' });
    }
    // Do not allow duplicate names in a room
    if (room.players.some(p => p.username.toLowerCase() === username.trim().toLowerCase())) {
      return callback({ error: 'Username already taken in this room' });
    }
    const player = { id: socket.id, username: username.trim(), score: 0 };
    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(code);
    callback({ room });
    io.to(code).emit('roomUpdate', { players: room.players, hostId: room.hostId });
  });

  /**
   * Event: startGame
   * Payload: { roomCode }
   * Only the host can start the game. When called, the server selects
   * random prompts according to the room difficulty and begins round 1.
   */
  socket.on('startGame', async ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'waiting') return;
    // Only allow the host to start
    if (socket.id !== room.hostId) return;
    room.status = 'playing';
    let generated = [];
    if (GEMINI_ENABLED) {
      try {
        generated = await aiGeneratePrompts(room.difficulty, room.rounds);
        console.log(`[Gemini] Generated prompts (${room.difficulty}):`, generated);
      } catch (err) {
        console.warn('[Gemini] prompt generation failed, using static set:', err.message);
      }
    }
    if (!generated.length) {
      const availablePrompts = prompts[room.difficulty] || [];
      const selected = [];
      const used = new Set();
      while (selected.length < room.rounds && used.size < availablePrompts.length) {
        const index = Math.floor(Math.random() * availablePrompts.length);
        if (!used.has(index)) {
          used.add(index);
          selected.push(availablePrompts[index]);
        }
      }
      generated = selected;
    }
    room.prompts = generated;
    room.currentRound = 0;
    beginRound(roomCode);
  });

  /**
   * Helper: beginRound
   * Starts a new round by broadcasting the prompt and end time to all
   * players. Also schedules automatic round completion in case not all
   * players submit in time.
   */
  function beginRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.currentRound >= room.rounds) {
      finishGame(roomCode);
      return;
    }
    const prompt = room.prompts[room.currentRound];
    room.submissions = {};
    room.startTime = Date.now();
    const endTime = room.startTime + 2 * 60 * 1000; // two minutes
    io.to(roomCode).emit('roundStart', {
      round: room.currentRound + 1,
      totalRounds: room.rounds,
      prompt,
      endTime
    });
    // Automatically finish the round after 2 minutes + slight buffer
    setTimeout(() => {
      completeRound(roomCode);
    }, 2 * 60 * 1000 + 2000);
  }

  /**
   * Event: submitPhoto
   * Payload: { roomCode, image }
   * Called by clients when they have taken or uploaded a photo. The server
   * simulates AI validation and records submission time. Once all players
   * have submitted or the timer expires, the round is completed.
   */
  socket.on('submitPhoto', async ({ roomCode, image }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;
    // Ignore duplicate submissions
    if (room.submissions[socket.id]) return;
    const submitTime = Date.now();
    const timeTaken = submitTime - room.startTime;
    const mission = room.prompts[room.currentRound];
    let validation = { valid: true, confidence: 0.5, reason: 'Default' };
    try {
      validation = await aiValidateImage(image, mission);
    } catch (err) {
      console.warn('[Gemini] validate error – fallback used:', err.message);
    }
    room.submissions[socket.id] = { correct: validation.valid, confidence: validation.confidence, timeTaken, reason: validation.reason };
    socket.emit('submissionReceived', { correct: validation.valid, confidence: validation.confidence, reason: validation.reason });
    // If all players have submitted early, finish the round
    if (Object.keys(room.submissions).length === room.players.length) {
      completeRound(roomCode);
    }
  });

  /**
   * Event: getCurrentState
   * Payload: { roomCode }
   * Allows a client that navigated late to the GamePage (after a round
   * already started) to fetch the current round's prompt and timer so
   * the first round is visible instead of appearing blank until the
   * second round. Responds via callback with current status.
   */
  socket.on('getCurrentState', ({ roomCode }, callback) => {
    if (typeof callback !== 'function') return; // guard
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    if (room.status === 'playing') {
      const prompt = room.prompts[room.currentRound];
      const round = room.currentRound + 1;
      const totalRounds = room.rounds;
      const endTime = room.startTime + 2 * 60 * 1000; // recompute to send
      return callback({ status: 'playing', prompt, round, totalRounds, endTime });
    }
    return callback({ status: room.status });
  });

  /**
   * Helper: completeRound
   * Once the timer expires or all players have submitted, this calculates
   * scores for the round and broadcasts the results. Then increments the
   * round counter and schedules the next round.
   */
  function completeRound(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;
    const results = [];
    // Build result objects for each player. Players who did not submit
    // receive no points and infinite time (for ordering).
    for (const player of room.players) {
      const submission = room.submissions[player.id];
      const correct = submission ? submission.correct : false;
      const timeTaken = submission ? submission.timeTaken : Infinity;
      results.push({ playerId: player.id, username: player.username, correct, timeTaken });
    }
    // Sort correct submissions by speed to assign bonuses
    const correctSubs = results.filter(r => r.correct).sort((a, b) => a.timeTaken - b.timeTaken);
    correctSubs.forEach((res, index) => {
      let bonus = 0;
      if (index === 0) bonus = 50;
      else if (index === 1) bonus = 30;
      else if (index === 2) bonus = 10;
      room.scores[res.playerId] += 100 + bonus;
    });
    // Players who submitted incorrectly get no points. Do not deduct points.
    results.forEach(res => {
      if (!res.correct) {
        room.scores[res.playerId] += 0;
      }
    });
    // Update players' score property
    room.players.forEach(player => {
      player.score = room.scores[player.id] || 0;
    });
    // Broadcast round results. Include per‑player scores so clients can
    // update their leaderboards without waiting for a separate event.
    io.to(roomCode).emit('roundResult', {
      round: room.currentRound + 1,
      results: results.map(r => ({
        username: r.username,
        correct: r.correct,
        timeTaken: r.timeTaken,
        score: room.scores[r.playerId]
      }))
    });
    room.currentRound += 1;
    // Delay before next round so players can view results
    setTimeout(() => {
      beginRound(roomCode);
    }, 5000);
  }

  /**
   * Helper: finishGame
   * Ends the game, calculates final standings and sends them to all
   * players. The room status is set to finished and players can then
   * decide to play again or leave.
   */
  function finishGame(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    room.status = 'finished';
    const standings = [...room.players].sort((a, b) => b.score - a.score).map(p => ({ username: p.username, score: p.score }));
    io.to(roomCode).emit('finalResult', { standings });
  }

  /**
   * Event: playAgain
   * Payload: { roomCode }
   * Resets the room state for a new game with the same players. Only
   * possible after the previous game has finished. The host remains the
   * same. Scores are reset to zero and the status returns to waiting.
   */
  socket.on('playAgain', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'finished') return;
    room.status = 'waiting';
    room.currentRound = 0;
    room.prompts = [];
    room.submissions = {};
    room.startTime = null;
    room.scores = {};
    room.players.forEach(player => {
      player.score = 0;
      room.scores[player.id] = 0;
    });
    io.to(roomCode).emit('roomUpdate', { players: room.players, hostId: room.hostId });
  });

  /**
   * Handle socket disconnect. Removes the player from their room and
   * triggers host migration if necessary. If the last player leaves the
   * room is deleted entirely.
   */
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const wasHost = room.hostId === socket.id;
        room.players.splice(idx, 1);
        delete room.scores[socket.id];
        delete room.submissions[socket.id];
        if (wasHost && room.players.length > 0) {
          room.hostId = room.players[0].id;
        }
        // Remove empty rooms
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          io.to(code).emit('roomUpdate', { players: room.players, hostId: room.hostId });
        }
        break;
      }
    }
  });
});

// Start listening on the configured port. If PORT is not defined the
// server defaults to 5000. In development you can run `npm run dev` to
// enable hot reloading via nodemon.
const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
  console.log(`ItemFinder game server listening on port ${port}`);
});