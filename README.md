# Snake Club · Mondi Arcade

Your own little arcade: a responsive browser Snake game with six skins, a personal player card, smooth movement, and optional sound. No package installation or build step is needed.

## Run

Install Python 3 and, to use npm commands, Node.js 18 or newer. From the repository root:

```sh
npm run dev
```

Open **http://localhost:8000** in your browser. `npm start` does the same thing. Without Node, run `python3 -m http.server 8000 --bind 0.0.0.0` directly. Stop the server with Ctrl+C.

## Play and personalize

- Use arrow keys or WASD to steer, Space to start/pause, or the on-screen buttons and swipes on mobile.
- Eat food for 10 points. Hitting a wall or your body ends the round. Speed increases as you grow.
- Edit your player name and choose Matcha, Lilac dream, Sunset, Ice pop, Berry bold, or Gold rush. Skins change your snake's colors, markings, food, and interface accents; all six are available immediately.
- Your name, skin, sound preference, best score, rounds played, and collected bites stay in this browser using local storage. Existing best scores are preserved. Clearing browser data resets them; they do not sync between devices or form a shared leaderboard.
- Sound starts off. Enable it with the Sound button. The game pauses when you leave the page or edit your name, and respects your device's reduced-motion preference.

This version is single-player. Static files can be hosted on any web server; real-time shared arenas would require a separate game server.

## Test

```sh
npm test
```

The seven gameplay tests cover movement, growth, reversal prevention, wall/body collisions, tail movement, and a full board. Browser checks should also cover all skins, profile and score persistence after reload, food collection, pause/resume, restart, name editing without game shortcuts, sound controls, and mobile layout and touch controls.
