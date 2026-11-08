import { SIZE, createGame, step } from './game.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#board'), ctx = canvas.getContext('2d'), cell = canvas.width / SIZE;
const skins = [
  { id: 'matcha', name: 'Matcha', color: '#c9f28b', body: '#82b85e', food: '#f4a58e', motto: 'Fresh by nature.', pattern: 'plain' },
  { id: 'lilac', name: 'Lilac dream', color: '#cbb0ff', body: '#9774cf', food: '#f5d681', motto: 'A little head in the clouds.', pattern: 'stripe' },
  { id: 'sunset', name: 'Sunset', color: '#ffac8a', body: '#df746c', food: '#c7ed98', motto: 'Golden hour, every hour.', pattern: 'plain' },
  { id: 'ice', name: 'Ice pop', color: '#93e6ee', body: '#4daebd', food: '#f6a6ce', motto: 'Cool under pressure.', pattern: 'sparkle' },
  { id: 'berry', name: 'Berry bold', color: '#f1a1d5', body: '#bd5b9b', food: '#9ce6ce', motto: 'Born to stand out.', pattern: 'stripe' },
  { id: 'gold', name: 'Gold rush', color: '#f5d47e', body: '#c49b4a', food: '#c1b1f7', motto: 'A very good kind of extra.', pattern: 'sparkle' },
];
function load(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
}
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Play still works without storage. */ } }
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const stored = load('snake-profile', {});
const profile = {
  name: typeof stored?.name === 'string' ? stored.name.slice(0, 20) : 'Mondi',
  skin: skins.some(s => s.id === stored?.skin) ? stored.skin : 'matcha',
  sound: stored?.sound === true,
  runs: count(stored?.runs), bites: count(stored?.bites),
};
let best = count(load('snake-best', 0)), game = createGame(), previous = game;
let queued = game.direction, running = false, paused = false, last = 0, interval = 145;
let hasPlayed = false, particles = [], audio, toastTimer;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skin = () => skins.find(s => s.id === profile.skin);
const displayName = () => profile.name.trim() || 'Player One';
function persist() { save('snake-profile', profile); }
function updateProfile() {
  const name = displayName();
  $('#avatar').textContent = Array.from(name)[0].toUpperCase();
  $('#welcome').textContent = `Hey ${name}, welcome to your little corner of the arcade.`;
  $('#runs').textContent = profile.runs; $('#bites').textContent = profile.bites;
  $('#best').textContent = String(best).padStart(3, '0');
  const goal = (Math.floor(best / 50) + 1) * 50;
  $('#rank').textContent = best >= 200 ? 'Arcade legend' : best >= 100 ? 'Trailblazer' : best >= 50 ? 'On a roll' : 'Fresh sprout';
  $('#goal-label').textContent = `${best} / ${goal} BEST`;
  $('#progress').max = goal; $('#progress').value = best;
  $('#goal-hint').textContent = best ? `Next stop: ${goal}. You’ve got this, ${name}.` : 'Your first 50 is calling.';
  $('#player-motto').textContent = profile.runs ? `${profile.runs === 1 ? 'One round' : `${profile.runs} rounds`} in. Your story is just getting started.` : 'A fresh start. A new high score.';
}
function show(title, hint, button, label) {
  $('#message').textContent = title; $('#hint').textContent = hint;
  $('#start').replaceChildren(document.createTextNode(button + ' '));
  const arrow = document.createElement('span'); arrow.textContent = '↗'; $('#start').append(arrow);
  $('#overlay-label').textContent = label; $('#overlay').hidden = false;
}
function equip(id) {
  profile.skin = id; persist();
  const s = skin();
  document.documentElement.style.setProperty('--accent', s.color);
  $('#equipped').textContent = s.name; $('#skin-caption').textContent = `${s.name} equipped. ${s.motto}`;
  document.querySelectorAll('.skin').forEach(button => {
    const selected = button.dataset.skin === id;
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.skin-check').textContent = selected ? '✓' : '';
  });
  draw(performance.now(), 1);
}
for (const s of skins) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'skin'; button.dataset.skin = s.id; button.dataset.pattern = s.pattern;
  button.style.setProperty('--skin', s.color); button.setAttribute('aria-label', `Wear ${s.name}`);
  button.innerHTML = `<span class="mini-snake" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="skin-name">${s.name}</span><span class="skin-check" aria-hidden="true"></span>`;
  button.addEventListener('click', () => equip(s.id)); $('#skins').append(button);
}
$('#player-name').value = profile.name;
$('#player-name').addEventListener('input', e => {
  profile.name = e.target.value.slice(0, 20); persist(); updateProfile();
  if (!running && !hasPlayed) show(`Your move, ${displayName()}.`, 'A little focus. A little hunger. How far will you grow?', 'Let’s play', 'YOUR ARCADE. YOUR RULES.');
});
$('#player-name').addEventListener('focus', () => { if (running && !paused) togglePause(); });
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2300); }
function initAudio() {
  if (!profile.sound) return;
  try { const Audio = window.AudioContext || window.webkitAudioContext; audio ??= new Audio(); audio.resume().catch(() => {}); } catch { /* Sound is optional. */ }
}
function tone(frequency, duration = .1) {
  if (!profile.sound || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(), volume = audio.createGain();
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(.06, audio.currentTime); volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(volume); volume.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
}
function updateSound() { $('#sound').textContent = profile.sound ? 'Sound on' : 'Sound off'; $('#sound').setAttribute('aria-pressed', String(profile.sound)); $('#sound').setAttribute('aria-label', profile.sound ? 'Disable sound' : 'Enable sound'); }
$('#sound').addEventListener('click', () => { profile.sound = !profile.sound; persist(); updateSound(); initAudio(); tone(440); });
function rounded(x, y, w, h, radius) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); }
function draw(now, alpha) {
  const s = skin();
  ctx.clearRect(0, 0, 600, 600);
  const background = ctx.createRadialGradient(300, 260, 10, 300, 300, 430);
  background.addColorStop(0, '#1b2428'); background.addColorStop(1, '#11171c'); ctx.fillStyle = background; ctx.fillRect(0, 0, 600, 600);
  ctx.fillStyle = '#354047';
  for (let y = 1; y < SIZE; y++) for (let x = 1; x < SIZE; x++) { ctx.beginPath(); ctx.arc(x * cell, y * cell, .8, 0, Math.PI * 2); ctx.fill(); }
  if (game.food) {
    const x = (game.food.x + .5) * cell, y = (game.food.y + .5) * cell;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(now / 240) * .08;
    ctx.fillStyle = s.food + '18'; ctx.beginPath(); ctx.arc(x, y, 17 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 15; ctx.shadowColor = s.food; ctx.fillStyle = s.food;
    ctx.beginPath(); ctx.arc(x, y, 7 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff9'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2); ctx.fill();
  }
  // Draw tail first so the head and its eyes always sit on top.
  for (let i = game.snake.length - 1; i >= 0; i--) {
    const p = game.snake[i], old = previous.snake[i] || previous.snake.at(-1) || p;
    const x = (old.x + (p.x - old.x) * alpha) * cell + 2, y = (old.y + (p.y - old.y) * alpha) * cell + 2;
    ctx.fillStyle = i === 0 ? s.color : s.body;
    ctx.shadowColor = s.color; ctx.shadowBlur = i === 0 ? 10 : 0;
    rounded(x, y, cell - 4, cell - 4, i === 0 ? 9 : 7); ctx.shadowBlur = 0;
    if (i && s.pattern === 'stripe') { ctx.fillStyle = s.color; rounded(x + 9, y + 3, 5, cell - 10, 2); }
    if (s.pattern === 'sparkle') { ctx.fillStyle = '#fff8'; rounded(x + 5, y + 5, 4, 4, 1); }
    if (!i) {
      const d = game.direction, cx = x + 13 + d.x * 5, cy = y + 13 + d.y * 5;
      for (const sign of [-1, 1]) {
        const ex = cx + d.y * sign * 6, ey = cy + d.x * sign * 6;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22212b'; ctx.beginPath(); ctx.arc(ex + d.x, ey + d.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (!paused) particles = particles.filter(p => now - p.born < 550);
  for (const p of particles) {
    const age = Math.min((now - p.born) / 550, 1);
    ctx.globalAlpha = 1 - age; ctx.fillStyle = s.food;
    ctx.beginPath(); ctx.arc(p.x + p.dx * age * 38, p.y + p.dy * age * 38, 3 * (1 - age), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function start() {
  $('#start').blur();
  if (paused) { togglePause(); return; }
  initAudio(); tone(520);
  game = createGame(); previous = game; queued = game.direction; particles = [];
  running = true; paused = false; hasPlayed = true; last = performance.now(); interval = 145;
  profile.runs++; persist(); updateProfile();
  $('#score').textContent = '000'; $('#overlay').hidden = true; $('#pause').disabled = false; $('#pause').textContent = 'Pause';
  $('#game-status').textContent = 'MAKE THIS ROUND YOURS';
}
function togglePause() {
  if (!running) return;
  paused = !paused; $('#pause').textContent = paused ? 'Resume' : 'Pause'; last = performance.now(); previous = game;
  $('#game-status').textContent = paused ? 'A LITTLE BREATHER' : 'MAKE THIS ROUND YOURS';
  if (paused) show('No rush.', `Your next bite can wait, ${displayName()}.`, 'Keep going', 'TAKE A BREATHER'); else { $('#overlay').hidden = true; $('#start').blur(); }
}
const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
function steer(name) { const d = directions[name]; if (running && !paused && d && !(d.x === -game.direction.x && d.y === -game.direction.y)) queued = d; }
$('#start').addEventListener('click', start); $('#pause').addEventListener('click', togglePause);
document.querySelectorAll('[data-dir]').forEach(button => button.addEventListener('click', () => steer(button.dataset.dir)));
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select,[contenteditable]')) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const name = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[key];
  if (name || (e.code === 'Space' && !e.target.closest('button,a'))) e.preventDefault();
  if (name) steer(name); else if (e.code === 'Space' && !e.repeat && !e.target.closest('button,a')) { if (!running) start(); else togglePause(); }
});
let pointer;
canvas.addEventListener('pointerdown', e => { pointer = {x:e.clientX, y:e.clientY}; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', e => {
  if (!pointer) return;
  const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y; pointer = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
  steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});
canvas.addEventListener('pointercancel', () => { pointer = null; });
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) togglePause(); });
window.addEventListener('blur', () => { if (running && !paused) togglePause(); });
function frame(now) {
  if (running && !paused && now - last >= interval) {
    last = now; previous = game; game = step(game, queued); queued = game.direction;
    if (game.score > previous.score) {
      profile.bites++; persist(); updateProfile(); tone(660 + (game.score % 50) * 7);
      if (!reducedMotion) for (let i = 0; i < 10; i++) { const angle = i * Math.PI / 5; particles.push({x:(previous.food.x + .5) * cell,y:(previous.food.y + .5) * cell,dx:Math.cos(angle),dy:Math.sin(angle),born:now}); }
      if (game.score % 50 === 0) toast(`${game.score} points. Looking good, ${displayName()}!`);
    }
    interval = Math.max(70, 145 - game.score / 4);
    $('#score').textContent = String(game.score).padStart(3, '0');
    if (game.over) {
      running = false; previous = game; $('#pause').disabled = true; tone(150, .25);
      const record = game.score > best;
      if (record) { best = game.score; save('snake-best', best); }
      updateProfile(); $('#game-status').textContent = record ? 'A NEW PERSONAL BEST. ALL YOU.' : 'THERE’S ALWAYS ANOTHER ROUND';
      show(game.food === null ? 'You grew everywhere!' : record ? `That’s a new best!` : `Good run, ${displayName()}.`, `${game.score} points · ${game.snake.length - 3} bites. ${record ? 'Your name belongs on that score.' : 'Every great run starts with another try.'}`, 'One more round', record ? 'A LITTLE PERSONAL HISTORY' : 'THE NEXT ONE IS YOURS');
    }
  }
  draw(now, reducedMotion || paused || !running ? 1 : Math.min(1, (now - last) / interval));
  requestAnimationFrame(frame);
}
updateProfile(); updateSound(); equip(profile.skin);
show(`Your move, ${displayName()}.`, 'A little focus. A little hunger. How far will you grow?', 'Let’s play', 'YOUR ARCADE. YOUR RULES.');
requestAnimationFrame(frame);
