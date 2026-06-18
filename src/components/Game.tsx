import { useCallback, useReducer } from "react";
import UndoIcon from "../../public/icon-undo.svg?react";
import { createInitialState, gameReducer } from "../game/reducer";
import type { Direction } from "../game/types";
import { useCheatCodes } from "../hooks/useCheatCodes";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { Header } from "./Header";
import { Board } from "./Board";
import { Button } from "./Button";

export function Game() {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialState,
  );

  const handleMove = useCallback((direction: Direction) => {
    dispatch({ type: "MOVE", direction });
  }, []);

  const handleNewGame = useCallback(() => dispatch({ type: "NEW_GAME" }), []);
  const handleUndo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const handleContinue = useCallback(
    () => dispatch({ type: "CONTINUE_AFTER_WIN" }),
    [],
  );

  useKeyboardControls(handleMove);
  useCheatCodes(dispatch);

  const canUndo = state.history.length > 0;

  return (
    <div className="game">
      <Header
        score={state.score}
        bestScore={state.bestScore}
        onNewGame={handleNewGame}
      />

      <main className="game__board-area">
        <Board
          state={state}
          onMove={handleMove}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onUndo={handleUndo}
        />

        <div className="game__controls">
          <Button
            className="undo-button"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo last move"
          >
            <div className="undo-button__inner">
              <UndoIcon className="undo-button__icon" aria-hidden="true" />
            </div>
          </Button>
        </div>
      </main>

      <footer className="footer">© 2026 Bluedot. All rights reserved.</footer>
    </div>
  );
}
