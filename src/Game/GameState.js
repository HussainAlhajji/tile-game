import { Deck } from '../models/Deck.js';
import { SpecialTile } from '../models/Tile.js';
class GameState {
    constructor() {
        this.deck = new Deck();
        this.preHand = [];
        this.playerScore = 0;
    }
    startGame() {
        this.hand = this.deck.getNewHand();
    }
    updateBet(value) {
        this.bet = value;
    }
resolveRound(hand,compare) {
    const roundNo = (this.roundCount = (this.roundCount || 0) + 1);
    const handScoreLog = this.computeScore(hand);
    const compareScoreLog = this.computeScore(compare);
    console.group(`Round ${roundNo}`);
    console.log("Bet:", this.bet);
    console.log("Your hand:", hand.map(t => t.name || `${t.value} ${t.suit}`), "= " + handScoreLog);
    console.log("Compare hand:", compare.map(t => t.name || `${t.value} ${t.suit}`), "= " + compareScoreLog);

this.preHand = hand.map(tile => {
    const frozenValue = tile.value;
    return {
        getValue: () => frozenValue,
        name: tile.name,
        category: tile.category,
        suit: tile.suit,
        value: frozenValue,
    };
});
    let outcome = "tie";
    let handScore = this.computeScore(hand);
    let compareScore = this.computeScore(compare);
if (handScore < compareScore && this.bet == "higher") {
    this.playerScore += compareScore;
    this.updateSpicalWinningTile();
    outcome = "You win!";
} else if (handScore > compareScore && this.bet == "lower") {
    // player bet lower, next hand IS lower → win
    this.playerScore += compareScore;
    this.updateSpicalWinningTile();
    outcome = "You win!";
} else if (handScore > compareScore && this.bet == "higher") {
    this.updateSpicalLosingTile();
    outcome = "You lose!";
} else if (handScore < compareScore && this.bet == "lower") {
    this.updateSpicalLosingTile();
    outcome = "You lose!";
}else if(handScore == compareScore) {
        // tie -> no change
        outcome = "It's a tie!";
    }
    this.bet = null;
if(this.checkGameOver()) {
    console.log("Game Over");
}else {
    this.startGame();
}
console.log("Outcome:", outcome);
    console.log("Score now:", this.playerScore);
    console.log("Special values:", this.deck.tiles
        .filter(t => t.category)
        .map(t => `${t.name}=${t.value}`).join(", "));
    console.log("Draw pile:", this.deck.filterTilesByStatus("draw").length,
        "| Reshuffles:", this.deck.reshuffleIndex);
    console.groupEnd();
return outcome;
}
    computeScore(hand) {
        let score = 0;
        for(const tile of hand) {
            tile.getValue();
            score += tile.getValue();
        }
        return score;

    }
updateSpicalWinningTile() {
    const names = new Set(
        this.hand
            .filter(tile => tile instanceof SpecialTile)
            .map(tile => tile.name)
    );
    for (const name of names) {
        for (const t of this.deck.tiles) {
            if (t instanceof SpecialTile && t.name === name) {
                t.updateWinningValue();
            }
        }
    }
}

updateSpicalLosingTile() {
    const names = new Set(
        this.hand
            .filter(tile => tile instanceof SpecialTile)
            .map(tile => tile.name)
    );
    for (const name of names) {
        for (const t of this.deck.tiles) {
            if (t instanceof SpecialTile && t.name === name) {
                t.updateLosingValue();
            }
        }
    }
}
checkWin() {
for(const tile of this.hand) {
    if(tile instanceof SpecialTile) {
        if(tile.getValue() == 10 ) {
            return true;
        }       
}
}
return false;
    }
checklose() {
    for(const tile of this.hand) {
        if(tile instanceof SpecialTile) {
            if(tile.getValue() == 0) {
                return true;
            }
        }
    }
    if(this.deck.reshuffleIndex >= 3) {
        return true;
    }
    return false;
}
    checkGameOver() {
    return this.checkWin() || this.checklose();

}
getGameOverReason() {
    for (const tile of this.hand) {
        if (tile instanceof SpecialTile) {
            if (tile.getValue() >= 10) {
                return `${tile.name} reached a value of 10`;
            }
            if (tile.getValue() <= 0) {
                return `${tile.name} dropped to a value of 0`;
            }
        }
    }
    if (this.deck.reshuffleIndex >= 3) {
        return "The draw pile ran out for the 3rd time";
    }
    return null;
}
}
export { GameState };