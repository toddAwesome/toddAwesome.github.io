// helper functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function AgentBrain(gameEngine) {
    this.size = 4;
    this.previousState = gameEngine.grid.serialize();
    this.reset();
    this.score = 0;
};

AgentBrain.prototype.reset = function () {
    this.score = 0;
    this.grid = new Grid(this.previousState.size, this.previousState.cells);
};

// Adds a tile in a random position
AgentBrain.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

AgentBrain.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
AgentBrain.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var cell, tile;
	
    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    //console.log(vector);

    //console.log(traversals);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });
    //console.log(moved);
    if (moved) {
        this.addRandomTile();
    }
    return moved;
};

// Get the vector representing the chosen direction
AgentBrain.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0, y: -1 }, // Up
        1: { x: 1, y: 0 },  // Right
        2: { x: 0, y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
AgentBrain.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1)
		traversals.x = traversals.x.reverse();
    if (vector.y === 1)
		traversals.y = traversals.y.reverse();

    return traversals;
};

AgentBrain.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

AgentBrain.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

function Agent() {
};

Agent.prototype.selectMove = function (gameManager) {
    var brain = new AgentBrain(gameManager);
    // Use the brain to simulate moves
    // brain.move(i) 
    // i = 0: up, 1: right, 2: down, 3: left
    // brain.reset() resets the brain to the current game board
	console.log(brain.grid.cells);
	console.log(sumTiles(brain));
	return evaluateMoves(brain, 1)[0];
    
};

function evaluateMoves(brain, level) {
	//console.log("level " + level);
	if (level <= 0) {
		//var move;
		//if (brain.move(0)) move = 0;
		//if (brain.move(1)) move = 1;
		//if (brain.move(3)) move = 3;
		//if (brain.move(2)) move = 2;
		return [0, countEmpty(brain), sumTiles(brain)];
	}
	var empty = new Array();
	var sums = new Array();
	for (var i = 0; i < 4; i++) {
		brain2 = new AgentBrain(brain);
		brain2.move(i);
		brain2.addRandomTile();
		result = evaluateMoves(brain2, level - 1);
		empty[i] = result[1];
		sums[i] = result[2];
	}
	console.log(sums);	
	var empty2 = empty.clone();
	empty2.sort()
	//console.log(moves, moves2);
	for (var i = 3; i >= 0; i--) {
		if (i > 0 && empty2[i] == empty2[i - 1]) {
			var count = 0;
			for (var j = i - 2; i >=0; i--) {
				if (empty2[i] == empty2[j])
					count++;
			}
			console.log("empty", empty);
			console.log("empty2", empty2);
			var moves = new Array();
			for (var j = 0; j < count; j++) {
				var pos = empty.indexOf(empty2[j]);
				moves.push(pos);
				empty[pos] = null;
			}
			console.log("empty", empty);
			console.log("empty2", empty2);
			var sums2 = new Array();
			for (var j = 0; j < moves.length; j++) {
				sums2.push(sums[moves[j]]);
			}
			sums2.sort();
			console.log("moves", moves);
			console.log("sums", sums);
			console.log("sums2", sums2);
			for (var j = sums2.length - 1; j >=0; j--) {
				var dir = sums.indexOf(sums2[j]);
				console.log(dir);
				if (brain.move(dir))
					return [dir, empty[i], sums2[j]];
				sums[dir] = null;
			}
		}
		var dir = empty.indexOf(empty2[i]);
		empty[dir] = null;
		console.log(empty, dir, empty2[i]);
		if (brain.move(dir))
			return [dir, empty2[i]];
	}
	return 0;
}

//Array.max = function( array ){
//    return Math.max.apply( Math, array );
//};

Array.prototype.clone = function() {
	return this.slice();
};

function countEmpty(brain) {
	var count = 0;
	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 4; j++)
			if (brain.grid.cells[i][j] == null)
				count++;
	return count;
}

function sumTiles(brain) {
	var a = brain.grid.cells.reduce(function(a,b) { return a.concat(b) });
	var sum = 0;
	for (var i = 0; i < a.length; i++)
		if (a[i])
		sum += a[i].value;
	return sum;
	console.log("a: ", a);
	return brain.grid.cells.reduce(function(a,b) { return a.concat(b) })
						   .reduce(function(a,b) { return (a ? a.value : 0) + (b ? b.value : 0)});
}

Agent.prototype.evaluateGrid = function (gameManager) {
    // calculate a score for the current grid configuration
	
};
