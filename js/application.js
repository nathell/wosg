// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  window.gm = new GameManager(5, KeyboardInputManager, HTMLActuator, LocalScoreManager);
});
