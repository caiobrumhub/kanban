import { create } from 'zustand';
import type { Board } from '../types';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  setCurrentBoard: (board: Board | null) => void;
  setBoards: (boards: Board[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  currentBoard: null,
  setCurrentBoard: (board) => set({ currentBoard: board }),
  setBoards: (boards) => set({ boards }),
}));
