import type { StateCreator } from "zustand"
import type { MeetingState } from "../meetingState"
import { NOTES_SEED } from "@/lib/seed"

/** Backing store for the Notes pod. */
export interface NotesSlice {
  notes: string
  notesUpdatedAt: number

  setNotes: (value: string) => void
}

export const initialNotesState = {
  notes: NOTES_SEED,
  notesUpdatedAt: Date.now(),
}

export const createNotesSlice: StateCreator<MeetingState, [], [], NotesSlice> = (set) => ({
  ...initialNotesState,

  setNotes: (notes) => set({ notes, notesUpdatedAt: Date.now() }),
})
