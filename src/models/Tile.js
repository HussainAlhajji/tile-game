class Tile {
  constructor() {
    this.value = 0;
    this.status = "draw"; //draw, discard, or hand
  }
    getValue() {
    return this.value;
  }
  updatestatus(value) {
    this.status = value;
  }
}
class NumberTile extends Tile {
  constructor(face , suit) {
    super();
    this.suit = suit;
    this.value = face;
  }

}
class SpecialTile extends Tile {
    constructor(name, category) {
        super();
        this.name = name;       // "RedDragon" — never changes, used for display
        this.category = category; // "Dragon" — never changes
        this.value = 5;         // changes over time
    }

  updateWinningValue() {
   this.value += 1;
    }
    updateLosingValue() {
      this.value -= 1;
    }
}
export { Tile, NumberTile, SpecialTile };