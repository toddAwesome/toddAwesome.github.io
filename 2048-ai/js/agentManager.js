// This code runs the simulation and sends the selected moves to the game
function AgentManager(gameManager) {
    this.gameManager = gameManager;
    this.agent = new Agent();
    this.moveCount = 0;
};

AgentManager.prototype.selectMove = function () {
    // 0: up, 1: right, 2: down, 3: left
    //if (this.gameManager.over) setTimeout(this.gameManager.restart.bind(this.gameManager), 1000);
    //else
    //    if (!this.gameManager.move(this.agent.selectMove(this.gameManager))) console.log("bad move");

    // game over
    if (this.gameManager.over) {
        console.log(this.gameManager.score + " in " + this.moveCount + " moves.");
		console.log("max tile was " + maxTile(this.gameManager));
		console.log(this.gameManager);
		// console.log(this.gameManager.grid.cells.map(function(d){return d.map(function(d){return d ? d.value: 0;})}));
		printBoard(this.gameManager);
		scores.push(maxTile(this.gameManager));
		printPercentage();
		this.moveCount = 0;
        setTimeout(this.gameManager.restart.bind(this.gameManager), 1000);
    } else { // game ongoing
        if (this.gameManager.won && !this.gameManager.keepPlaying) {
            this.gameManager.keepplaying();
            this.selectMove();
            console.log("Game Won!");
        }
        else {
			var move = this.agent.selectMove(this.gameManager)
            if (!this.gameManager.move(move)) console.log("bad move", move);
            else this.moveCount++;
        }
    }
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

function printPercentage() {
	scores.sort(function(a, b) { return b - a; });
	var count = 0;
	for (var i = 0; i < scores.length; i++) {
		if (scores[i] < 2048)
			i = scores.length;
		else count++;
	}
	console.log("number of games:", scores.length);
	console.log("win percentage:", (count / scores.length * 100) + "%");
}

var scores = new Array();