/*
2048 AI
TCSS 435
Manvir Singh
Todd Robbins
Sean Robbins
*/

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
    // if (moved) {
        // this.addRandomTile();
    // }
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


//depth of tree
var depth = 5;

//attempts to pick the best move
Agent.prototype.selectMove = function (gameManager) {
    var brain = new AgentBrain(gameManager);
	return brain.evaluateMove(depth)[0];
};

//weights
var smoothWeight = 2;
var monWeight = 0.5;
var maxWeight = 1;
var posWeight = 2;
var emptyWeight = 2;
var chainWeight = 2;

AgentBrain.prototype.evaluateGrid = function () {
	var brain = this;
    var smoothness = calcSmoothness(brain);
	var monotonicity = calcMontonicity(brain);
	var max = Math.log2(maxTile(brain));
	var maxPos = maxPosition(brain);
	var empty = countEmpty(brain);
	var chain = chainScore(brain);
	var total =
				// Math.log2(brain.score) +
			    smoothness * smoothWeight +
			    monotonicity * monWeight +
			    // maxPos * max * posWeight +
				max * maxWeight +
			    empty * emptyWeight +
			    // chain * max * chainWeight +
				0;
	if (max >= 11) total += 100;
	return total;
};

function printBoard(brain) {
	var cells = brain.grid.cells.map(function(d){return d.map(function(d){return d ? d.value: 0;})});
	var string = "";
	for (var i = 0; i < cells[0].length; i++) {
		for (var j = 0; j < cells.length; j++) {
			string += cells[j][i] + "\t";
		}
		string += "\n"
	}
	console.log(string);
}

//attempts to return the best possible move
AgentBrain.prototype.evaluateMove = function (level) {
	var brain = this;
	if (level <= 0)
		return [0, brain.evaluateGrid()];
	var moves = new Array();
	for (var i = 0; i < 4; i++) {
		brain2 = new AgentBrain(brain);
		brain2.move(i);
		brain2.addRandomTile();
		moves[i] = brain2.evaluateMove(level - 1);
		moves[i][0] = i;
	}
	moves.sort(function(a,b) { return a[1] != b[1] ? b[1] - a[1] : (a[2] != b[2] ? b[2] - a[2] : b[3] - a[3]); });
	for (var i = 0; i < moves.length; i++)
		if (brain.move(moves[i][0]))
			return moves[i];
	return [0, 0, 0];
}

//attempts to return the best possible move
AgentBrain.prototype.evaluateMove2 = function (level) {
	var brain = this;
	if (level <= 0)
		return [0, brain.evaluateGrid()];
	var moves = new Array();
	for (var i = 0; i < 4; i++) {
		brain2 = new AgentBrain(brain);
		brain2.move(i);
		var empty = brain2.grid.availableCells();
		var moves2 = new Array();
		for (var j = 0; j < empty.length; j++) {
			for (var val = 2; val <= 4; val *= 2) {
				brain3 = new AgentBrain(brain2);
				var tile = new Tile(empty[j], val);
				brain3.grid.insertTile(tile);
				var move = brain3.evaluateMove2(level - 1);
				move[1] *= (val == 2) ? 0.9 : 0.1;
				moves2.push(move);
			}
		}
		moves[i] = [i, 0];
		for (var j = 0; j < moves2.length; j++) {
			moves[i][1] += moves2[j][1];
		}
		moves[i][1] /= moves2.length;
	}
	moves.sort(function(a,b) { return a[1] != b[1] ? b[1] - a[1] : (a[2] != b[2] ? b[2] - a[2] : b[3] - a[3]); });
	for (var i = 0; i < moves.length; i++)
		if (brain.move(moves[i][0]))
			return moves[i];
	return [0, 0, 0];
}

//returns to number of empty cells
function countEmpty(brain) {
	var count = 0;
	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 4; j++)
			if (brain.grid.cells[i][j] == null)
				count++;
	return count;
}

//calculation of smoothness
function calcSmoothness(brain) {
	var cells = brain.grid.cells;
	var smoothness = 0;
	for (var i = 0; i < cells.length; i++) {
		var previous = cells[i][0] ? cells[i][0].value : 0;
		for (var j = 1; j < cells[i].length; j++) {
			if (cells[i][j]) {
				var current = cells[i][j].value;
				if (current == previous) {
					smoothness += current;
				}
				previous = current;
			}
		}
	}
	for (var i = 0; i < cells[0].length; i++) {
		var previous = cells[0][i] ? cells[0][i].value : 0;
		for (var j = 1; j < cells.length; j++) {
			if (cells[j][i]) {
				var current = cells[j][i].value;
				if (current == previous) {
					smoothness += current;
				}
				previous = current;
			}
		}
	}
	return smoothness / maxTile(brain);
}

//calculation of monotonicity
function calcMontonicity(brain) {
	var monotonicity = 0;
	var cells = brain.grid.cells;
	for (var i = 0; i < cells.length; i++) {
		var previous = cells[i][0] ? cells[i][0].value : 0;
		for (var j = 1; j < cells[i].length; j++) {
			if (cells[i][j]) {
				var current = cells[i][j].value;
				var range = [previous / 2, previous * 2];
				if (range.indexOf(current) != -1) {
						monotonicity += Math.max(current, previous);
				}
				previous = current;
			}
		}
	}
	for (var i = 0; i < cells[0].length; i++) {
		var previous = cells[0][i] ? cells[0][i].value : 0;
		for (var j = 1; j < cells.length; j++) {
			if (cells[j][i]) {
				var current = cells[j][i] ? cells[j][i].value : 0;
				var range = [previous / 2, previous * 2];
				if(range.indexOf(current) != -1) {
						monotonicity += Math.max(current, previous);
				}
				previous = current;
			}
		}
	}
	return monotonicity / maxTile(brain);
}

//returns the information of the max tile(s)
function maxInfo(brain) {
	var max = [[0, -1, -1]];
	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < 4; j++) {
			if (brain.grid.cells[i][j]) {
				var value = brain.grid.cells[i][j].value;
				if (value > max[0][0]) {
					max = [[value, i, j]];
				} else if (value == max[0][0]) {
					max.push([value, i, j]);
				}
			}
		}
	}
	return max;
}

//returns the value of the max tile
function maxTile(brain) {
	return maxInfo(brain)[0][0];
}

//returns the score of the max tile position (2 for corner and 1 for side)
function maxPosition(brain) {
	var max = maxInfo(brain);
	var positions = new Array();
	for (var i = 0; i < max.length; i++) {
		positions.push(positionScore(max[i]));
	}
	positions.sort(function(a, b) { return b - a; });
	return positions[0] * positions[0];
}

function positionScore(cell) {
	return cell.slice(1).map(function(d) { return Math.floor(((d - 1 + 4) % 4)/ 2);})
								.reduce(function(a,b) { return a + b; })
}

//returns the chain score
function chainScore(brain) {
	var max = maxInfo(brain);
	// console.log(max);
	var chains = new Array();
	for (var i = 0; i < max.length; i++) {
		var traversed = new Array();
		chains.push(calcChain(brain, max[i], traversed) / max[i][0], true);
	}
	chains.sort(function(a, b) { return b - a; });
	return chains[0];
}

//recursive chain score helper
function calcChain(brain, max, traversed, first) {
	var neighbors = new Array();
	var scores = new Array();
	for (var i = max[1] - 1; i < max[1] + 2; i++) {
		for (var j = i == max[1] ? max[2] - 1 : max[2]; j < max[2] + 2; j += 2) {
			if (brain.grid.withinBounds({x:i, y:j})) {
				if (brain.grid.cells[i][j])
					neighbors.push([brain.grid.cells[i][j].value, i, j]);
			}
		}
	}
	for (var i = 0; i < neighbors.length; i++) {
		var travContains = traversed.indexOf(JSON.stringify(neighbors[i])) > -1;
		traversed.push(JSON.stringify(neighbors[i]));
		if (max[0] == neighbors[i][0] * 2)
			scores[i] = max[0] * (first ? 8 : 1) + calcChain(brain, neighbors[i], traversed,  false);
		else if (max[0] == neighbors[i][0] && !travContains)
			scores[i] = max[0] * (first ? 8 : 1) * 4 + calcChain(brain, neighbors[i], traversed, false);
		else
			scores[i] = 0;
	}
	scores.sort(function(a, b) { return b - a; });
	return scores[0];
}
