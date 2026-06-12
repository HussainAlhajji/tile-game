#Hand betting
Mahjong tile betting game built with JavaScript and React.

Running Instructions:
npm install
npm run dev
Opens at http://localhost:5173/

Development Details:
- Vanilla JS (ES6 classes) for all game logic
- React + Vite for the UI
- CSS animations, no external libraries
- localStorage for leaderboard

Structure:
src/
  models/Tile.js, Deck.js   — game logic
  Game/GameState.js          — state management
  App.jsx, App.css           — UI and styling
  
AI-Usage:
Game logic (Tile, Deck, GameState) is ~90% handwritten; I worked through 
the OOP model, state flow, and edge cases myself. React/CSS was AI-assisted 
since I hadn't used React before this project. Visual direction and 
architecture decisions are mine
