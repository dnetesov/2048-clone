# Bluedot 2048

A clone of 2048 game, built with Vite + React + TypeScript and plain CSS  no UI, state, or animation libraries.

Slide numbered tiles with the arrow keys (or swipe on touch devices). When two
tiles with the same number touch, they merge into one. Reach the **2048** tile
to win.

## Getting started

```bash
pnpm install
pnpm run dev
```

Then open the printed local URL (default `http://localhost:3000`).

Some of the key functionality is covered with unit-tests.
To run unit tests:

```bash
pnpm test
```

To create a production build:
```bash
pnpm run build
pnpm run preview
```
## Key assumptions

- For the game start I assumed standard 2048 behavior: a new game starts with two random tiles
- For Win and Game Over states I chose a modal-like overlay with a simple message
- I read about different implementations of 2048 and decided that player can continue after the "Win" screen appeared
- Win overlay includes "Continue" button while "Game Over" overlay includes the undo button
- Undo does not affect the persisted best score
- Animations are css-only

## Architecture

The project deliberately separates **pure game logic** from **React rendering**:

```
src/
  main.tsx              App entry point
  App.tsx               Renders the Game container

  game/
    constants.ts        Grid size, win value, spawn odds, geometry
    types.ts            Direction, Tile, GameSnapshot, GameState, GameAction
    logic.ts            Pure functions: move, merge, spawn, win/lose detection
    reducer.ts          NEW_GAME / MOVE / UNDO / CONTINUE_AFTER_WIN
    reducer.test.ts     Unit tests for reducer-level game behavior
    storage.ts          Best-score persistence (localStorage)

  hooks/
    useCheatCodes.ts        Hidden QA keyboard shortcuts
    useKeyboardControls.ts   Arrow keys, move actions
    useSwipeControls.ts      Touch swipes, move actions

  components/
    Game.tsx            Owns reducer state, wires up controls
    Header.tsx          Logo, score cards, New Game button
    Board.tsx           Static grid + shadow layer + tile layer + overlays
    GridCell.tsx        Static empty cell backdrop
    Tile.tsx            Animated tiles and their matching shadow elements
    ScoreCard.tsx       Score / Best card
    Button.tsx          Shared button
    GameOverlay.tsx     Win / Game Over overlay

  styles/
    global.css          All styling and animations organized using BEM methodology
```

### Why my game logic is separated from React

All movement, merging, spawning, and win/lose detection live in `game/logic.ts`
as **pure functions** that take state in and return new state out. They have no
knowledge of React, the DOM, or rendering. I choose this approach because:

- The rules can be reasoned about and tested in isolation.
- React components stay thin,  they only render state and dispatch actions.
- The movement algorithm exists in exactly one place, not scattered across UI.

### Why `useReducer`

Redux-style store was the best candidate for holding the game state like this.
Game state is a single object whose transitions are driven by a small
set of well-defined actions (`NEW_GAME`, `MOVE`, `UNDO`, `CONTINUE_AFTER_WIN`).
A reducer models this far more cleanly than several `useState` calls: every
transition is explicit, centralized in `game/reducer.ts`, and easy to follow.

This also makes the reducer a useful testing boundary. The unit tests assert
the user-visible state transitions directly: new game reset, undo restoration,
win overlay behavior, continue-after-win behavior, game-over detection, and the
rule that invalid moves do not spawn tiles or create undo history.

### How the movement algorithm works

For a given direction, the board is read line by line (row or column) in the
order tiles travel. Each line is then compressed toward the movement edge, and
adjacent equal tiles merge  with the guarantee that **a tile can merge only
once per move**. Tiles keep a stable `id` where possible so the UI can animate
them sliding via CSS `transform: translate(...)`.

A move is considered **valid** only if at least one tile changed position or
merged. Invalid moves are a no-op: they do not spawn a new tile and do not
create an undo history entry.

### How best-score persistence works

`game/storage.ts` reads and writes the best score to `localStorage` under a
single key. The reducer updates the best score whenever the current score
exceeds it and writes it immediately. Reads and writes are wrapped in
`try/catch` so the game still works if storage is unavailable.

### How undo works

Before every **valid** move, the reducer pushes a snapshot (tiles, score, win
state, game-over state) onto a history stack, enabling **unlimited undo**. It's somewhat
close to the simple text-editor history stack.
`UNDO` pops the most recent snapshot and restores it. So:

- Invalid moves never create history entries.
- Undo restores board, score, win-overlay state, and game-over state.
- Undo never lowers the persisted best score.

## Game state model

- `hasWon`  the player has created a 2048 tile at some point.
- `hasSeenWinOverlay`  controls whether the win overlay is currently visible.
  Winning is **not** terminal: pressing **Continue** hides the overlay and lets
  play continue, while `hasWon` stays true so the overlay does not reappear.
  It is one of the assumptions I made along the process considering the examples
  I saw online.
- `isGameOver`  the board is full and no move changes anything.
- `NEW_GAME` resets the board, score, win state, game-over state, and history,
  but keeps `bestScore`.

## Rendering & animation

- Ask me about the elevator assignment I did several years ago :)
- Static empty cells are rendered as a separate background layer.
- Tile shadows live in their own absolutely positioned layer over the static
  grid but below the numbered tiles.
- Numbered tiles live in a separate absolutely positioned layer over the shadow
  layer and are moved with `transform: translate(...)`, animated by CSS
  transitions.
- New tiles scale in from 0; merged tiles play a short pop animation.
- All animations are CSS-only.

### Tile shadows and the Figma distinction

The Figma spec includes two inner shadows and a very small drop shadow:

```css
box-shadow:
  -4px -4px 2px 0 rgba(0, 0, 0, 0.08) inset,
  4px 4px 1px 0 rgba(255, 255, 255, 0.2) inset,
  0 1px 2px 0 rgba(67, 51, 32, 0.3);
```

The two inner shadows are applied directly to `.tile`, because they belong to
the tile surface itself.

I intentionally implemented visible cast shadow differently from the raw
Figma drop-shadow value. On the actual board, `0 1px 2px` is too subtle for
110px tiles and 4px gaps, so the app uses a separate `.tile-shadow-layer` with
one `.tile-shadow` per tile. Each shadow is a blurred pseudo-element offset
toward the bottom-right, matching the intended light source from the top-left.

This split solves two rendering problems:

- All cast shadows stay below all tile faces, even while tiles move with
  `transform` and create their own stacking contexts.
- The visual result matches the screenshot better than a literal Figma CSS
  export while preserving the Figma inset highlights on the tile surface.

## Tests

Vitest is used for fast unit tests, covering the core functionality:

```bash
pnpm test
```

The current tests focus on reducer-level behavior because the reducer is where
the important gameplay state transitions happen. Random tile spawning is made
deterministic in tests by mocking `Math.random` per case.

## Hidden QA cheat codes

The app includes two hidden keyboard cheat codes for manual testing:

How to use:
In local dev, just type:
- `showtiles` displays every styled tile value from 2 through 2048.
- `win2048` clears the board and leaves two adjacent 1024 tiles, so the next
  left move wins.

In deployed builds: open the app with ?cheats=1, then type the code

They are intentionally not exposed in the UI. Cheat codes are enabled in local
development automatically. In a deployed build, open the app with `?cheats=1`
in the URL to enable them for that session.

The reducer owns the actual state transitions (`CHEAT_SHOWCASE` and
`CHEAT_READY_TO_WIN`). `useCheatCodes.ts` only listens for hidden keyboard
sequences and dispatches those actions when cheats are enabled. This keeps
test-only behavior explicit, easy to remove, and isolated from the regular UI.

## Known limitations

- CSS variables are storing all the colors directly, probably could use some kind of pattern (lighten/darken)
- Responsive layout is a little clunky (score cards) but fully functional
