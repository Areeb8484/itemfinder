# Mobile Photo Challenge Game

This repository contains a complete, production‑ready implementation of a **mobile‑first multiplayer photo challenge game**. Players join a virtual room, receive creative photo prompts, and compete to capture or upload images that match the prompt within a two‑minute window. Points are awarded for correct submissions and bonus points for speed. After a series of rounds the game displays a podium with final scores and allows players to play again or return to the home screen.

## Project Structure

```
photo-challenge-game/
├── client/        # React frontend (mobile‑first, PWA‑ready)
│   ├── public/    # Static assets, index.html and manifest
│   ├── src/       # React components, pages, context and styles
│   ├── Dockerfile # Builds and serves the frontend via Nginx
│   └── README.md  # Usage instructions for the frontend
├── server/        # Node.js/Express backend
│   ├── data/      # Photo prompt lists
│   ├── index.js   # Express and Socket.IO server
│   ├── Dockerfile # Production container for the backend
│   └── README.md  # Usage instructions for the backend
├── docker-compose.yml # Example to run both services together
└── README.md      # This file
```

## Quick Start

You will need [Node.js](https://nodejs.org/) (version 18 or later recommended) and [npm](https://www.npmjs.com/) installed.

1. **Clone the repository** and navigate into it:

   ```bash
   git clone <repository-url>
   cd photo-challenge-game
   ```

2. **Start the backend**:

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Optionally edit .env to customise the port and CORS origins
   npm run dev
   ```

   This will start the API server on `http://localhost:5000` with hot reloading.

3. **Start the frontend** in a separate terminal:

   ```bash
   cd client
   npm install
   echo "VITE_SERVER_URL=http://localhost:5000" > .env
   npm run dev
   ```

   The React development server will run on `http://localhost:5173`. Open that URL in multiple browser windows or devices to simulate multiple players.

4. **Play the game**:
   * Enter a username and create a room with your chosen difficulty and number of rounds.
   * Share the six‑character room code with friends so they can join.
   * When everyone is ready, the host starts the game and prompts appear.
   * Use the device camera or file picker to submit a matching photo. The server randomly determines correctness during development.
   * After all rounds a final leaderboard appears. Choose to play again (reusing the same room) or leave.

## Docker

If you prefer to run the application in containers, a `docker-compose.yml` file is provided. It builds and serves both the backend and frontend:

```bash
docker-compose up --build
```

The backend will be available on port `5000` and the frontend on port `5173` (proxied through Nginx). Update `CORS_ORIGIN` in `server/.env` if you change ports.

## Deployment

The server can be deployed to platforms like Heroku or Railway, and the client can be hosted on Vercel, Netlify or any static hosting provider. Ensure that the frontend’s `VITE_SERVER_URL` points to the deployed backend URL and update `CORS_ORIGIN` on the server accordingly.

## Customisation & Extensibility

* **Prompts** – The lists of photo prompts live in `server/data/prompts.js`. Feel free to tailor these to your audience or add more categories.
* **AI Integration** – The mock validation endpoint at `POST /api/validate` returns random results for development. Replace this logic with calls to the Gemini API or another vision model when integrating real image recognition.
* **Persistent Storage** – Current room and score data are stored in memory. For longer‑running deployments consider storing game state in Redis or a database so games can survive server restarts.
* **Styling** – The client uses a small amount of bespoke CSS and aims to be responsive. You can integrate Tailwind, Material UI, or your own design system if you wish.

Enjoy your game night!