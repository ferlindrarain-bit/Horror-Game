import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.__GAME__ = game; // Expose for testing & debug
});
