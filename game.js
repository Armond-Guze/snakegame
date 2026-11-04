export const SIZE = 20;
export function placeFood(snake, random = Math.random) {
  const free = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++)
    if (!snake.some(p => p.x === x && p.y === y)) free.push({ x, y });
  return free.length ? free[Math.floor(random() * free.length)] : null;
}
export function createGame() {
  const snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  return { snake, direction: { x: 1, y: 0 }, food: placeFood(snake), score: 0, over: false };
}
export function step(game, direction = game.direction) {
  if (game.over) return game;
  if (direction.x === -game.direction.x && direction.y === -game.direction.y) direction = game.direction;
  const head = { x: game.snake[0].x + direction.x, y: game.snake[0].y + direction.y };
  const eating = game.food && head.x === game.food.x && head.y === game.food.y;
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE || body.some(p => p.x === head.x && p.y === head.y))
    return { ...game, over: true };
  const snake = [head, ...game.snake];
  if (!eating) snake.pop();
  const food = eating ? placeFood(snake) : game.food;
  return { snake, direction, food, score: game.score + (eating ? 10 : 0), over: food === null };
}
