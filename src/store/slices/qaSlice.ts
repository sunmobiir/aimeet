import type { StateCreator } from "zustand"
import type { Participant, QaQuestion } from "@/types"
import type { MeetingState } from "../meetingState"
import { SELF_ID, uid } from "../shared"
import { QA_POOL } from "@/lib/seed"

/** Backing store for the Q&A pod. */
export interface QaSlice {
  questions: QaQuestion[]

  askQuestion: (body: string) => void
  voteQuestion: (id: string) => void
  answerQuestion: (id: string, answer: string) => void
  dismissQuestion: (id: string) => void
}

export const initialQaState = {
  questions: [] as QaQuestion[],
}

/** Webinars start with a few seeded questions so the pod is not empty. */
export function qaRoomState(template: string, others: Participant[]) {
  if (template !== "webinar") return initialQaState
  return {
    questions: QA_POOL.slice(0, 3).map((body, i) => ({
      id: uid(),
      authorId: others[i]?.id ?? "guest",
      authorName: others[i]?.name ?? "Guest",
      body,
      at: Date.now() - i * 60_000,
      votes: Math.floor(Math.random() * 9),
      votedBySelf: false,
      answered: false,
    })),
  }
}

export const createQaSlice: StateCreator<MeetingState, [], [], QaSlice> = (set, get) => ({
  ...initialQaState,

  askQuestion: (body) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const self = get().participants.find((p) => p.isSelf)
    set((s) => ({
      questions: [
        {
          id: uid(),
          authorId: SELF_ID,
          authorName: self?.name ?? "You",
          body: trimmed,
          at: Date.now(),
          votes: 0,
          votedBySelf: false,
          answered: false,
        },
        ...s.questions,
      ],
    }))
  },

  voteQuestion: (id) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === id ? { ...q, votes: q.votedBySelf ? q.votes - 1 : q.votes + 1, votedBySelf: !q.votedBySelf } : q,
      ),
    })),

  answerQuestion: (id, answer) =>
    set((s) => ({
      questions: s.questions.map((q) => (q.id === id ? { ...q, answered: true, answer } : q)),
    })),

  dismissQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),
})
