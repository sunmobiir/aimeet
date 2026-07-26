import type { StateCreator } from "zustand"
import type { MeetingState } from "../meetingState"

/** Backing store for the Share pod (slide deck on the stage). */
export interface ShareSlice {
  slide: number
  slideCount: number

  setSlide: (n: number) => void
}

export const initialShareState = {
  slide: 1,
  slideCount: 12,
}

export const createShareSlice: StateCreator<MeetingState, [], [], ShareSlice> = (set) => ({
  ...initialShareState,

  setSlide: (n) => set((s) => ({ slide: Math.min(Math.max(1, n), s.slideCount) })),
})
