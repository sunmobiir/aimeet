import type { StateCreator } from "zustand"
import type { Stroke } from "@/types"
import type { MeetingState } from "../meetingState"
import { SELF_ID } from "../shared"

/** Backing store for the Whiteboard pod. */
export interface WhiteboardSlice {
  strokes: Stroke[]

  addStroke: (stroke: Stroke) => void
  undoStroke: () => void
  clearStrokes: () => void
}

export const initialWhiteboardState = {
  strokes: [] as Stroke[],
}

export const createWhiteboardSlice: StateCreator<MeetingState, [], [], WhiteboardSlice> = (set) => ({
  ...initialWhiteboardState,

  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),

  undoStroke: () =>
    set((s) => {
      // Undo only removes the local user's most recent stroke.
      const lastSelf = [...s.strokes].reverse().find((st) => st.authorId === SELF_ID)
      if (!lastSelf) return s
      return { strokes: s.strokes.filter((st) => st.id !== lastSelf.id) }
    }),

  clearStrokes: () => set({ strokes: [] }),
})
