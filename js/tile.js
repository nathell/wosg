function Tile(position, letter) {
  this.x                = position.x;
  this.y                = position.y;
  this.letter           = letter;
  this.value            = GameManager.letters[letter].value;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};
