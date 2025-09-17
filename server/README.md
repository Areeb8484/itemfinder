# Photo Challenge Game – Backend

This directory contains the Express/Node.js backend for the **Mobile Photo Challenge Game**. The server is responsible for real‑time room management, timer synchronisation and scoring via Socket.IO, and it exposes a small REST API for health checks and mock AI photo validation. Rooms are kept entirely in memory which makes this implementation lightweight and easy to deploy. For production use you may wish to persist room state in a database or cache.

## Features

* Create and join game rooms using a six‑character alphanumeric code
* Host migration when the creator disconnects
* Real‑time player lists, prompt distribution and timer updates via Socket.IO
* Mock AI endpoint that simulates validating an image against the current prompt (returns a random boolean and confidence score)
* Synchronous scoring system awarding base points for correct submissions and bonus points to the fastest three players
* Ability to restart a finished game with the same players and settings

## Setup

1. Navigate to the `server` directory:

   ```bash
   cd photo-challenge-game/server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the `.env.example` file to `.env` and customise it if necessary:

   ```bash
   cp .env.example .env
   # edit .env to adjust the port or CORS origins
   ```

4. Start the server in development mode (auto‑restarts on file changes):

   ```bash
   npm run dev
   ```

   To run without nodemon use:

   ```bash
   npm start
   ```

The server listens on the port defined by the `PORT` environment variable (default `5000`) and accepts Socket.IO connections as well as HTTP requests.

## Endpoints

### `GET /health`

Simple health check endpoint that returns `{ status: "ok" }`. Useful for container orchestration readiness/liveness checks.

### `POST /api/validate`

Mock AI validation endpoint. Accepts JSON with the fields:

| Field   | Type   | Description                                           |
| ------- | ------ | ----------------------------------------------------- |
| image   | string | Base64‑encoded image data URI                         |
| prompt  | string | The current photo prompt                              |

It returns a JSON object containing `valid` (boolean) and `confidence` (0–1). In this development implementation the result is random; integrate the Gemini API here later.

## Socket.IO Events

All real‑time functionality is delivered over Socket.IO namespaces on the HTTP server. Below is a summary of the custom events:

| Event           | Direction | Data                                        | Description                                                                           |
| --------------- | --------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `createRoom`    | client → server | `{ username, difficulty, rounds }`        | Creates a new room and registers the sender as host. Responds via callback with room details. |
| `joinRoom`      | client → server | `{ username, roomCode }`                   | Adds a player to an existing room. Responds via callback with current room state.    |
| `roomUpdate`    | server → client | `{ players, hostId }`                     | Broadcast whenever the players list or host changes.                                  |
| `startGame`     | client → server | `{ roomCode }`                              | Host triggers the game start. Random prompts are selected and round 1 begins.         |
| `roundStart`    | server → client | `{ round, totalRounds, prompt, endTime }` | Announces the start of a round and provides the prompt and timer end time (ms).       |
| `submitPhoto`   | client → server | `{ roomCode, image }`                      | Player submits a photo. The server randomly determines correctness and stores timing. |
| `submissionReceived` | server → client | `{ correct }`                             | Acknowledges receipt of a submission and informs whether it was deemed correct.       |
| `roundResult`   | server → client | `{ round, results }`                       | Emits at the end of a round with per‑player correctness, times and cumulative scores. |
| `finalResult`   | server → client | `{ standings }`                            | Sent after all rounds have completed with the final leaderboard.                      |
| `playAgain`     | client → server | `{ roomCode }`                             | Resets the room to a waiting state so another game can be played.                     |

## Deployment

The server is ready to run in containers or on services like Heroku or Railway. A simple `Dockerfile` is included for convenience:

```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

If you wish to orchestrate the server and client together, see the top‑level `docker-compose.yml` in the repository root.

## Notes

* Because room state is stored entirely in memory, restarting the server will drop all ongoing games. For persistent deployments you should integrate a backing store such as Redis or a database.
* To add or modify the photo prompts, edit `data/prompts.js`. Each array should contain at least as many prompts as the maximum number of rounds you intend to play.
* This server currently mocks AI validation. When ready, replace the handler in `POST /api/validate` with calls to your image recognition service of choice.