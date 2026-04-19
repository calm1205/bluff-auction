import type { GameState } from "@bluff-auction/shared";
import { createInitialState } from "./gameEngine.js";

// プロトタイプでは単一ルームで運用
export class RoomManager {
  private state: GameState = createInitialState();

  getState(): GameState {
    return this.state;
  }

  reset(): void {
    this.state = createInitialState();
  }
}
