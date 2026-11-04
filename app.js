import { SIZE, createGame, step } from './game.js';
const canvas = document.querySelector('#board'), ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay'), pause = document.querySelector('#pause');
let game = createGame(), queued = game.direction, running = false, paused = false, last = 0, best = 0;
try { best = Number(localStorage.getItem('snake-best')) || 0; } catch {}
document.querySelector('#best').textContent = best;
function draw() {
  const cell = canvas.width / SIZE;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#253328'; ctx.lineWidth = 0.5;
  for (let i = 1; i < SIZE; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, 600); ctx.moveTo(0, i * cell); ctx.lineTo(600, i * cell); ctx.stroke(); }
  game.snake.forEach((p, i) => { ctx.fillStyle = i ? '#8db85f' : '#c1ec84'; ctx.beginPath(); ctx.roundRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4, 6); ctx.fill(); });
  if (game.food) { ctx.fillStyle = '#f48b75'; ctx.beginPath(); ctx.arc((game.food.x + .5) * cell, (game.food.y + .5) * cell, 9, 0, Math.PI * 2); ctx.fill(); }
  document.querySelector('#score').textContent = game.score;
}
function show(title, hint, button) { document.querySelector('#message').textContent = title; document.querySelector('#hint').textContent = hint; document.querySelector('#start').textContent = button; overlay.hidden = false; }
function start() {
  if (paused) { togglePause(); return; }
  game = createGame(); queued = game.direction; running = true; paused = false; last = performance.now(); overlay.hidden = true; pause.textContent = 'Pause'; draw();
}
function togglePause() {
  if (!running) return;
  paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; last = performance.now();
  if (paused) show('Take a breather.', 'Your next bite can wait.', 'Resume ↗'); else overlay.hidden = true;
}
const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
function steer(name) { const d = directions[name]; if (d && !(d.x === -game.direction.x && d.y === -game.direction.y)) queued = d; }
document.querySelector('#start').addEventListener('click', start); pause.addEventListener('click', togglePause);
document.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => steer(b.dataset.dir)));
document.addEventListener('keydown', e => {
  const name = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[e.key];
  if (name || e.code === 'Space') e.preventDefault();
  if (name) steer(name); else if (e.code === 'Space') togglePause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) togglePause(); });
function frame(now) {
  if (running && !paused && now - last >= Math.max(65, 145 - game.score / 4)) {
    last = now; game = step(game, queued); queued = game.direction; draw();
    if (game.over) {
      running = false;
      if (game.score > best) { best = game.score; document.querySelector('#best').textContent = best; try { localStorage.setItem('snake-best', best); } catch {} }
      show(game.food === null ? 'You grew everywhere!' : 'That’s a wrap.', `You scored ${game.score}. Ready for another round?`, 'Play again ↗');
    }
  }
  requestAnimationFrame(frame);
}
draw(); requestAnimationFrame(frame);
