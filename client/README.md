# Photo Challenge Game – Frontend

This directory contains the React frontend for the **Mobile Photo Challenge Game**. It is designed with a mobile‑first approach and uses Socket.IO for real‑time communication with the backend. The application runs as a Progressive Web App (PWA) and can be installed on supported devices for an app‑like experience.

## Features

* Simple username entry with no registration required
* Create a game by selecting difficulty and number of rounds
* Join existing games via a six‑character room code
* Lobby screen showing all connected players and waiting for the host to start
* Real‑time display of prompts, countdown timer and per‑round results
* Photo capture/upload using the browser camera or file picker
* Responsive leaderboard with base and bonus points awarded for correct and fast submissions
* Final results screen with play‑again and leave options
* Offline caching and installability via the PWA manifest

## Setup

1. Navigate to the `client` directory:

   ```bash
   cd photo-challenge-game/client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file to configure the backend URL. Copy from the example below:

   ```bash
   # .env
   VITE_SERVER_URL=http://localhost:5000
   ```

   Adjust the URL if your backend runs on a different host or port.

4. Start the development server:

   ```bash
   npm run dev
   ```

   This will launch the app on `http://localhost:5173` by default. It will automatically reload on file changes.

5. Build for production:

   ```bash
   npm run build
   ```

   The optimised static files will be written to the `dist` folder. You can serve these files with any static file server or using the provided Dockerfile.

## Progressive Web App

The app includes a `manifest.json` and basic icon placeholders under `public/icons`. To fully brand your PWA, replace the placeholder images (`icon-192.png` and `icon-512.png`) with your own artwork. The service worker is generated automatically by Vite during the build when you integrate a PWA plugin.

To install the app on mobile devices, open the site in a supported browser (e.g. Chrome on Android) and use the “Add to Home Screen” option.

## Deployment

The included `Dockerfile` builds the React app and serves it via Nginx. You can run it on its own or alongside the backend using docker‑compose. See the repository root for an example `docker-compose.yml` that orchestrates both services.

## Customisation

* To modify styling, edit `src/index.css` or add your own CSS modules/components.
* If you wish to use Tailwind CSS or another styling framework, install it and configure Vite accordingly.
* For richer camera functionality, consider integrating the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) directly instead of using the file input.