# Snake

A responsive, dependency-free browser game with keyboard and on-screen controls, pause/resume, increasing speed, and a saved best score.

## Run

Requires Python 3. From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the served page in a modern browser. Use arrow keys or WASD to steer, Space to pause, and the on-screen buttons on mobile. Eat food to earn 10 points; hitting a wall or your body ends the round.

## Test

Requires Node.js 18 or newer. No package installation is needed.

```sh
node --test
```

The tests cover movement, growth, reversal prevention, wall/body collisions, tail movement, and a full board. Static files can be hosted on any web server.
