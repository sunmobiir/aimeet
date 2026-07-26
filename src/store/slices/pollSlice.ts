import type { StateCreator } from "zustand"
import type { Poll } from "@/types"
import type { MeetingState } from "../meetingState"
import { uid } from "../shared"

/** Backing store for the Poll pod. */
export interface PollSlice {
  polls: Poll[]

  createPoll: (input: { question: string; type: Poll["type"]; options: string[] }) => void
  votePoll: (pollId: string, optionIds: string[]) => void
  setPollOpen: (pollId: string, open: boolean) => void
  removePoll: (pollId: string) => void
}

export const initialPollState = {
  polls: [] as Poll[],
}

export const createPollSlice: StateCreator<MeetingState, [], [], PollSlice> = (set) => ({
  ...initialPollState,

  createPoll: ({ question, type, options }) => {
    const clean = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || clean.length < 2) return
    const poll: Poll = {
      id: uid(),
      question: question.trim(),
      type,
      options: clean.map((label) => ({ id: uid(), label, votes: 0 })),
      open: true,
      createdAt: Date.now(),
      myVotes: [],
    }
    set((s) => ({ polls: [poll, ...s.polls] }))
  },

  votePoll: (pollId, optionIds) =>
    set((s) => ({
      polls: s.polls.map((p) => {
        if (p.id !== pollId) return p
        const options = p.options.map((o) => {
          const was = p.myVotes.includes(o.id)
          const now = optionIds.includes(o.id)
          if (was === now) return o
          return { ...o, votes: Math.max(0, o.votes + (now ? 1 : -1)) }
        })
        return { ...p, options, myVotes: optionIds }
      }),
    })),

  setPollOpen: (pollId, open) => set((s) => ({ polls: s.polls.map((p) => (p.id === pollId ? { ...p, open } : p)) })),

  removePoll: (pollId) => set((s) => ({ polls: s.polls.filter((p) => p.id !== pollId) })),
})
