import './App.css';
import { useState, useEffect } from 'react';
import { GameState } from './Game/GameState.js';

// ─── Leaderboard helpers ──────────────────────────────────────────────────────
function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem('mahjong_lb')) || []; }
  catch { return []; }
}
function saveToLeaderboard(name, score) {
  const board = getLeaderboard();
  board.push({ name, score });
  board.sort((a, b) => b.score - a.score);
  const top5 = board.slice(0, 5);
  localStorage.setItem('mahjong_lb', JSON.stringify(top5));
  return top5;
}

// ─── Suit symbols ─────────────────────────────────────────────────────────────
const SUIT_SYMBOL    = { Bamboo: '🎋', Character: '🀄', Dot: '⭕' };
const SPECIAL_SYMBOL = { Dragon: '🐉', Wind: '🌬️' };

// ─── Tile Card ────────────────────────────────────────────────────────────────
function TileCard({ tile, small = false, index = 0, animate = false }) {
  const isSpecial = tile.category !== undefined;
  const symbol = isSpecial ? SPECIAL_SYMBOL[tile.category] : SUIT_SYMBOL[tile.suit];
  const topLabel = isSpecial
    ? tile.name.replace('Dragon', '').replace('Wind', '')
    : tile.value;
  const bottomLabel = isSpecial ? tile.category : tile.suit;
  const val = typeof tile.getValue === 'function' ? tile.getValue() : tile.value;

  return (
    <div
      className={[
        'tile',
        small ? 'tile--small' : '',
        isSpecial ? 'tile--special' : '',
        animate ? 'tile--deal' : '',
      ].join(' ')}
      style={animate ? { animationDelay: `${index * 0.1}s` } : undefined}
    >
      <div className="tile__face">
        <div className="tile__corner tile__corner--tl"><span>{val}</span></div>
        <div className="tile__center">
          <div className="tile__symbol">{symbol}</div>
          <div className="tile__name">{topLabel}</div>
          <div className="tile__suit">{bottomLabel}</div>
        </div>
        <div className="tile__corner tile__corner--br"><span>{val}</span></div>
        {isSpecial && <div className="tile__special-band" />}
      </div>
    </div>
  );
}

// ─── Hand display ─────────────────────────────────────────────────────────────
function HandDisplay({ hand, label, total, small = false, highlight, animate = false }) {
  return (
    <div className={`hand-block ${highlight ? `hand-block--${highlight}` : ''}`}>
      <div className="hand-block__header">
        <span className="hand-block__label">{label}</span>
        <span className="hand-block__total">Total <strong>{total}</strong></span>
      </div>
      <div className="tile-row">
        {hand.map((tile, i) => (
          <TileCard key={i} tile={tile} small={small} index={i} animate={animate} />
        ))}
      </div>
    </div>
  );
}

// ─── Special tiles sidebar ────────────────────────────────────────────────────
// One row per unique tile name, sorted highest → lowest.
// Rows keep stable DOM order (alphabetical) and move visually via transform,
// so a value change makes the row "lift and glide" to its new rank.
const ROW_H = 46; // row height + gap, used for positional transforms

function SpecialSidebar({ game }) {
  const [snapshot, setSnapshot] = useState({});
  const [lifted, setLifted] = useState(new Set());

  const seen = new Set();
  const specials = game.deck.tiles
    .filter(t => t.category !== undefined)
    .filter(t => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });

  const ranked = [...specials].sort(
    (a, b) => b.getValue() - a.getValue() || a.name.localeCompare(b.name)
  );

  // Detect value changes during render (React's "adjust state when props change" pattern)
  const changedNames = specials
    .filter(t => snapshot[t.name] !== undefined && snapshot[t.name] !== t.getValue())
    .map(t => t.name);
  const isNewData =
    changedNames.length > 0 || specials.some(t => snapshot[t.name] === undefined);

  if (isNewData) {
    const map = {};
    specials.forEach(t => { map[t.name] = t.getValue(); });
    setSnapshot(map);
    if (changedNames.length > 0) setLifted(new Set(changedNames));
  }

  // Clear the lift effect after the glide animation finishes
  useEffect(() => {
    if (lifted.size === 0) return;
    const id = setTimeout(() => setLifted(new Set()), 700);
    return () => clearTimeout(id);
  }, [lifted]);

  const domOrder = [...specials].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside className="sidebar">
      <h3 className="sidebar__title">Special Tiles</h3>
      <p className="sidebar__hint">Value 0 or 10 ends the game</p>
      <div className="sidebar__list" style={{ height: ranked.length * ROW_H }}>
        {domOrder.map(t => {
          const v = t.getValue();
          const rank = ranked.findIndex(r => r.name === t.name);
          const danger = v <= 1 || v >= 9;
          return (
            <div
              key={t.name}
              className={[
                'sidebar__row',
                danger ? 'sidebar__row--danger' : '',
                lifted.has(t.name) ? 'sidebar__row--lift' : '',
              ].join(' ')}
              style={{ transform: `translateY(${rank * ROW_H}px)` }}
            >
              <span className="sidebar__icon">{SPECIAL_SYMBOL[t.category]}</span>
              <span className="sidebar__name">
                {t.name.replace('Dragon', ' Dragon').replace('Wind', ' Wind')}
              </span>
              <span className="sidebar__bar">
                <span className="sidebar__bar-fill" style={{ width: `${v * 10}%` }} />
              </span>
              <span className="sidebar__value">{v}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('landing');
  const [game, setGame] = useState(new GameState());

  function updateGame() {
    setGame(Object.assign(Object.create(Object.getPrototypeOf(game)), game));
  }
  function handleNewGame() {
    const g = new GameState();
    g.startGame();
    setGame(g);
    setScreen('game');
  }

  return (
    <div className="app">
      {screen === 'landing'  && <LandingPage onNewGame={handleNewGame} />}
      {screen === 'game'     && <GameScreen game={game} updateGame={updateGame} setScreen={setScreen} />}
      {screen === 'gameover' && <GameOver game={game} onRestart={() => setScreen('landing')} />}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function LandingPage({ onNewGame }) {
  const board = getLeaderboard();
  return (
    <div className="landing">
      <div className="landing__center">
        <div className="landing__deco">🀄</div>
        <h1 className="landing__title">Hand Betting Game</h1>
        <p className="landing__sub">
          Read the tiles. Predict the next hand.<br />
          Higher or lower — your call.
        </p>
        <button className="btn btn--primary btn--lg" onClick={onNewGame}>
          New Game
        </button>

        <div className="landing__lb-zone">
          <span className="landing__lb-trigger">🏆 Leaderboard</span>
          <div className="landing__lb-panel">
            {board.length === 0 ? (
              <p className="muted">No scores yet. Be the first.</p>
            ) : (
              <ol className="leaderboard">
                {board.map((e, i) => (
                  <li key={i} className="leaderboard__row">
                    <span className="leaderboard__rank">#{i + 1}</span>
                    <span className="leaderboard__name">{e.name}</span>
                    <span className="leaderboard__score">{e.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
function GameScreen({ game, updateGame, setScreen }) {
  const [result, setResult]             = useState(null);
  const [compareHand, setCompare]       = useState(null);
  const [compareTotal, setCTotal]       = useState(null);
  const [yourTotal, setYourTotal]       = useState(null);
  const [showResult, setShowResult]     = useState(false);
  const [betLocked, setBetLocked]       = useState(false);
  const [reshuffleNotice, setReshuffle] = useState(null);

  const HAND_SIZE  = 4;
  const REVEAL_MS  = HAND_SIZE * 100 + 350; // tile stagger + settle
  const HOLD_MS    = 1700;                  // verdict on screen
  const SHUFFLE_MS = 1400;                  // reshuffle banner on screen

  function handleBet(bet) {
    if (betLocked) return;
    setBetLocked(true);

    const reshufflesBefore = game.deck.reshuffleIndex;

    const ch = game.deck.getTileToCompare(game.hand.length);

    const yt = game.computeScore(game.hand);
    const ct = game.computeScore(ch);

    game.updateBet(bet);
    const outcome = game.resolveRound(game.hand, ch);

    const reshuffled   = game.deck.reshuffleIndex > reshufflesBefore;
    const newDrawCount = game.deck.filterTilesByStatus('draw').length;

    setCompare(ch);
    setCTotal(ct);
    setYourTotal(yt);
    setResult(outcome);
    setShowResult(false);

    setTimeout(() => setShowResult(true), REVEAL_MS);

    setTimeout(() => {
      if (game.checkGameOver()) {
        setScreen('gameover');
        return;
      }

      const advance = () => {
        updateGame();
        setCompare(null);
        setCTotal(null);
        setYourTotal(null);
        setResult(null);
        setShowResult(false);
        setBetLocked(false);
      };

      if (reshuffled) {
        setReshuffle({ newDrawCount });
        setTimeout(() => {
          setReshuffle(null);
          advance();
        }, SHUFFLE_MS);
      } else {
        advance();
      }
    }, REVEAL_MS + HOLD_MS);
  }

  const drawCount    = game.deck.filterTilesByStatus('draw').length;
  const discardCount = game.deck.filterTilesByStatus('discard').length;
  const handTotal    = game.computeScore(game.hand);
  const isWin  = result === 'You win!';
  const isLose = result === 'You lose!';

  return (
    <div className="game">
      <div className="game__topbar">
        <button className="btn btn--ghost" onClick={() => setScreen('landing')}>← Exit</button>
        <span className="game__score">Score <strong>{game.playerScore}</strong></span>
        <div className="game__pile-info">
          <span>Draw pile <strong>{drawCount}</strong></span>
          <span>Discard pile <strong>{discardCount}</strong></span>
          <span>Reshuffles <strong>{game.deck.reshuffleIndex}/3</strong></span>
        </div>
      </div>

      <div className="game__layout">
        <SpecialSidebar game={game} />

        <div className="table">
          {/* Opponent */}
          <div className="opponent">
            <div className="opponent__identity">
              <div className="opponent__avatar">🕴️</div>
              <div>
                <div className="opponent__name">The Dealer</div>
                <div className="opponent__status">
                  {compareHand
                    ? (showResult ? 'Hand revealed' : 'Revealing hand…')
                    : 'Waiting for your bet…'}
                </div>
              </div>
            </div>

            <div className="opponent__hand-zone">
              {compareHand ? (
                <HandDisplay
                  hand={compareHand}
                  label="Dealer's hand"
                  total={compareTotal}
                  highlight={showResult ? (isLose ? 'win' : isWin ? 'lose' : null) : null}
                  animate
                />
              ) : (
                <div className="opponent__facedown">
                  {Array.from({ length: HAND_SIZE }).map((_, i) => (
                    <div key={i} className="tile tile--back" style={{ animationDelay: `${i * 0.07}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verdict / reshuffle banner */}
          <div className="verdict-zone">
            {reshuffleNotice ? (
              <div className="shuffle-banner">
                <span className="shuffle-banner__icon">🔄</span>
                <span>
                  Draw pile empty — reshuffling… fresh deck added.
                  New draw pile: <strong>{reshuffleNotice.newDrawCount}</strong> tiles
                </span>
              </div>
            ) : showResult && result ? (
              <div className={`result-badge ${isWin ? 'result-badge--win' : isLose ? 'result-badge--lose' : 'result-badge--tie'}`}>
                {result}
              </div>
            ) : null}
          </div>

          {/* Player */}
          <div className="player">
            <div className="player__hand-zone">
              <HandDisplay
                hand={compareHand ? game.preHand : game.hand}
                label="Your hand"
                total={compareHand ? yourTotal : handTotal}
                highlight={showResult ? (isWin ? 'win' : isLose ? 'lose' : null) : null}
                animate={!compareHand}
              />
            </div>

            <div className="bet-row">
              <button className="btn btn--higher" onClick={() => handleBet('higher')} disabled={betLocked}>
                ▲ Bet Higher
              </button>
              <div className="bet-row__hint">Will the next hand beat yours?</div>
              <button className="btn btn--lower" onClick={() => handleBet('lower')} disabled={betLocked}>
                ▼ Bet Lower
              </button>
            </div>

            {game.preHand && game.preHand.length > 0 && !compareHand && (
              <div className="player__history">
                <HandDisplay
                  hand={game.preHand}
                  label="Previous hand"
                  total={game.computeScore(game.preHand)}
                  small
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Game Over ────────────────────────────────────────────────────────────────
function GameOver({ game, onRestart }) {
  const [name, setName]   = useState('');
  const [saved, setSaved] = useState(false);
  const [board, setBoard] = useState(getLeaderboard());

  function handleSave() {
    if (!name.trim()) return;
    setBoard(saveToLeaderboard(name.trim(), game.playerScore));
    setSaved(true);
  }

  return (
    <div className="gameover">
      <div className="gameover__card">
        <h1 className="gameover__title">Game Over</h1>
        <p className="gameover__reason">{game.getGameOverReason()}</p>
        <div className="gameover__score">
          <span className="gameover__score-label">Final Score</span>
          <span className="gameover__score-value">{game.playerScore}</span>
        </div>

        {!saved ? (
          <div className="gameover__save">
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button className="btn btn--primary" onClick={handleSave}>Save Score</button>
          </div>
        ) : (
          <p className="gameover__saved">✓ Score saved to leaderboard</p>
        )}

        <h2 className="section-title">Leaderboard</h2>
        <ol className="leaderboard">
          {board.map((e, i) => (
            <li key={i} className="leaderboard__row">
              <span className="leaderboard__rank">#{i + 1}</span>
              <span className="leaderboard__name">{e.name}</span>
              <span className="leaderboard__score">{e.score}</span>
            </li>
          ))}
        </ol>

        <button className="btn btn--ghost" onClick={onRestart}>Back to Menu</button>
      </div>
    </div>
  );
}