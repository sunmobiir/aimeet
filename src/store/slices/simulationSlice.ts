import type { StateCreator } from "zustand"
import type { QaQuestion } from "@/types"
import type { MeetingState } from "../meetingState"
import { makeParticipant, systemMessage, uid } from "../shared"
import { NAME_POOL, QA_POOL } from "@/lib/seed"

export interface SimulationSlice {
  simulateJoin: () => void
  simulateLeave: () => void
  simulateChat: () => void
  simulateQuestion: () => void
  simulateActivity: () => void
}

export const createSimulationSlice: StateCreator<MeetingState, [], [], SimulationSlice> = (set) => ({
  simulateJoin: () =>
    set((s) => {
      if (s.locked || s.participants.length >= 16) return s
      const taken = new Set(s.participants.map((p) => p.name))
      const available = NAME_POOL.filter((n) => !taken.has(n))
      if (!available.length) return s
      const name = available[Math.floor(Math.random() * available.length)]
      const p = makeParticipant(name, "participant", s.participants.length)
      p.joinedAt = Date.now()
      return {
        participants: [...s.participants, p],
        messages: [...s.messages, systemMessage(`${name} joined the meeting.`)],
      }
    }),

  simulateLeave: () =>
    set((s) => {
      const candidates = s.participants.filter((p) => !p.isSelf && p.role === "participant")
      if (candidates.length <= 2) return s
      const gone = candidates[Math.floor(Math.random() * candidates.length)]
      return {
        participants: s.participants.filter((p) => p.id !== gone.id),
        messages: [...s.messages, systemMessage(`${gone.name} left the meeting.`)],
      }
    }),

  simulateChat: () => {
    // implemented in lib/simulation to keep message pool logic out of the store
  },

  simulateQuestion: () =>
    set((s) => {
      const candidates = s.participants.filter((p) => !p.isSelf)
      if (!candidates.length) return s
      const asker = candidates[Math.floor(Math.random() * candidates.length)]
      const asked = new Set(s.questions.map((q) => q.body))
      const available = QA_POOL.filter((q) => !asked.has(q))
      if (!available.length) return s
      const body = available[Math.floor(Math.random() * available.length)]
      const q: QaQuestion = {
        id: uid(),
        authorId: asker.id,
        authorName: asker.name,
        body,
        at: Date.now(),
        votes: 0,
        votedBySelf: false,
        answered: false,
      }
      return { questions: [q, ...s.questions] }
    }),

  simulateActivity: () =>
    set((s) => {
      const speakerIndex = Math.random() > 0.25 ? Math.floor(Math.random() * s.participants.length) : -1
      return {
        participants: s.participants.map((p, i) => {
          if (p.isSelf) return { ...p, speaking: p.micOn && Math.random() > 0.6 }
          const drift = Math.random() * 12 - 6
          return {
            ...p,
            speaking: i === speakerIndex && p.micOn,
            engagement: Math.min(100, Math.max(20, Math.round(p.engagement + drift))),
            handRaised: Math.random() > 0.97 ? !p.handRaised : p.handRaised,
          }
        }),
      }
    }),
})
