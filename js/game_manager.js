function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid        = new Grid(this.size);

  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;
  this.addedWords  = [];

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

GameManager.letters = {
    A: {value: 1, count: 9},
    B: {value: 3, count: 2},
    C: {value: 3, count: 2},
    D: {value: 2, count: 4},
    E: {value: 1, count:12},
    F: {value: 4, count: 2},
    G: {value: 2, count: 3},
    H: {value: 4, count: 2},
    I: {value: 1, count: 9},
    J: {value: 8, count: 1},
    K: {value: 5, count: 1},
    L: {value: 1, count: 2},
    M: {value: 3, count: 2},
    N: {value: 1, count: 6},
    O: {value: 1, count: 8},
    P: {value: 3, count: 2},
    Q: {value:10, count: 1},
    R: {value: 1, count: 6},
    S: {value: 1, count: 4},
    T: {value: 1, count: 6},
    U: {value: 1, count: 4},
    V: {value: 4, count: 2},
    W: {value: 4, count: 2},
    X: {value: 8, count: 1},
    Y: {value: 4, count: 2},
    Z: {value:10, count: 1},
};

String.prototype.repeat = function(times) {
   return (new Array(times + 1)).join(this);
};

String.prototype.randomChar = function() {
    return this[Math.floor(Math.random() * this.length)];
};

GameManager.letterDist = "";
for (var letter in GameManager.letters) {
    GameManager.letterDist += letter.repeat(GameManager.letters[letter].count);
}

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var letter = "Q";
    var tile = new Tile(this.grid.randomAvailableCell(), GameManager.letterDist.randomChar());

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated(),
    addedWords: this.addedWords
  });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

GameManager.prototype.gatherWords = function(x, y, horizontal) {
  var words = [], cell = this.grid.cells[x][y];
  if (!cell)
    return words;
  var current = ""; 
  while (x < this.size && y < this.size && cell) {
    current += cell.letter;
    words.push(current);
    if (horizontal) x++; else y++;
    if (x < this.size && y < this.size) 
        cell = this.grid.cells[x][y];
  }
  return words;
}

GameManager.prototype.scoreWord = function(word) {
  var score = 0;
  for (i = 0; i < word.length; i++)
    score += GameManager.letters[word[i].toUpperCase()].value;
  if (word.length == 4)
    score += 10;
  if (word.length == 5)
    score += 30;
  return score;
}

GameManager.prototype.clearGrid = function() {
  var self = this;
  var toClear = [];
  for (var y = 0; y < this.size; y++) {
    for (var x = 0; x < this.size - 2; x++) {
      words = this.gatherWords(x, y, true);
      for (var i = words.length - 1; i >= 0; i--) {
        var word = words[i].toLowerCase();
        if (dictionary[word]) {
          toClear.push({x: x, y: y, word: word, dir: true});
          break;
        }
      }
    }
  }

  for (var y = 0; y < this.size - 2; y++) {
    for (var x = 0; x < this.size; x++) {
      words = this.gatherWords(x, y, false);
      for (var i = words.length - 1; i >= 0; i--) {
        var word = words[i].toLowerCase();
        if (dictionary[word]) {
          toClear.push({x: x, y: y, word: word, dir: false});
          break;
        }
      }
    }
  }

    
  for (var i = 0; i < toClear.length; i++) {
    var word = toClear[i].word, x = toClear[i].x, y = toClear[i].y, dir = toClear[i].dir;
    this.score += this.scoreWord(toClear[i].word);
    for (var j = 0; j < word.length; j++) {
      this.grid.removeTile({x: x, y: y});
      if (dir) x++; else y++;
    }
  }    

  this.addedWords = toClear;

  return toClear;
}

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (false /* next && next.value === tile.value && !next.mergedFrom */) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  self.clearGrid();

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() /* || this.tileMatchesAvailable() */;
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
