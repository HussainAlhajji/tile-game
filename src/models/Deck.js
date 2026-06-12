import { NumberTile, SpecialTile } from './Tile.js';
class Deck {
  constructor() {
    this.tiles = [];
    this.discardTiles = [];
    this.handTiles = [];
    this.comparedToTile= []
    this.initializeDeck();
    this.reshuffleIndex = 0;

  }
    initializeDeck() {
        this.tiles[0] = new SpecialTile("RedDragon", "Dragon");
        this.tiles[1] = new SpecialTile("GreenDragon", "Dragon");
        this.tiles[2] = new SpecialTile("WhiteDragon", "Dragon");
        this.tiles[3] = new SpecialTile("EastWind", "Wind");
        this.tiles[4] = new SpecialTile("WestWind", "Wind");
        this.tiles[5] = new SpecialTile("SouthWind", "Wind");
        this.tiles[6] = new SpecialTile("NorthWind", "Wind");
        for (let suit of ["Bamboo", "Character", "Dot"]) {
          for (let face = 1; face <= 9; face++) {
            this.tiles.push(new NumberTile(face, suit));
          } 
        }
  }
  filterTilesByStatus(status) {
    return this.tiles.filter(tile => tile.status === status);
  }
  getNewHand() {
    const hand = [];
    let drawTiles = this.filterTilesByStatus("draw");
    if (drawTiles.length < 8) {
        this.reshfuffle();
        drawTiles = this.filterTilesByStatus("draw");
    }
    const count = Math.min(4, drawTiles.length);
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * drawTiles.length);
      const tile = drawTiles[randomIndex];
      drawTiles.splice(randomIndex, 1); // drop so cant be picked again
      hand.push(tile);
      tile.updatestatus("discard");
      this.discardTiles.push(tile);
    }

    return hand;
  }
getTileToCompare(count) {
    const compare = [];
    let drawTiles = this.filterTilesByStatus("draw");
    if (drawTiles.length == 0) {
        this.reshfuffle();
        drawTiles = this.filterTilesByStatus("draw");
    }
    const drawCount = Math.min(count, drawTiles.length);
    for (let i = 0; i < drawCount; i++) {
        const randomIndex = Math.floor(Math.random() * drawTiles.length);
        const tile = drawTiles[randomIndex];
        drawTiles.splice(randomIndex, 1);
        compare.push(tile);
    }
    return compare;
}

reshfuffle() {
    this.reshuffleIndex += 1;
    this.tiles = [];
    this.initializeDeck();
        for (const fresh of this.tiles) {
        if (fresh.category !== undefined) {
            const tracked = this.discardTiles.find(t => t.name === fresh.name);
            if (tracked) fresh.value = tracked.value;
        }
    }
    this.discardTiles.forEach(tile => tile.updatestatus("draw"));
    this.tiles = this.tiles.concat(this.discardTiles);
    this.discardTiles = [];
}


}

export { Deck };