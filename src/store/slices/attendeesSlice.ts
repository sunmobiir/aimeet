import type { StateCreator } from "zustand"
import type { Participant, Role } from "@/types"
import type { MeetingState } from "../meetingState"
import { SELF_ID, systemMessage } from "../shared"

/** Backing store for the Attendees pod. */
export interface AttendeesSlice {
  participants: Participant[]

  raiseHand: () => void
  setSelfStatus: (status: Participant["status"]) => void
  setParticipantRole: (id: string, role: Role) => void
  muteParticipant: (id: string) => void
  lowerHand: (id: string) => void
  removeParticipant: (id: string) => void
  muteEveryone: () => void
  lowerAllHands: () => void
}

export const initialAttendeesState = {
  participants: [] as Participant[],
}

export const createAttendeesSlice: StateCreator<MeetingState, [], [], AttendeesSlice> = (set) => ({
  ...initialAttendeesState,

  raiseHand: () =>
    set((s) => ({
      participants: s.participants.map((p) => (p.isSelf ? { ...p, handRaised: !p.handRaised } : p)),
    })),

  setSelfStatus: (status) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.isSelf ? { ...p, status: p.status === status ? null : status } : p)),
    })),

  setParticipantRole: (id, role) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.id === id ? { ...p, role } : p)),
    })),

  muteParticipant: (id) =>
    set((s) => ({
      micOn: id === SELF_ID ? false : s.micOn,
      participants: s.participants.map((p) => (p.id === id ? { ...p, micOn: false, speaking: false } : p)),
    })),

  lowerHand: (id) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.id === id ? { ...p, handRaised: false } : p)),
    })),

  removeParticipant: (id) =>
    set((s) => {
      const gone = s.participants.find((p) => p.id === id)
      if (!gone || gone.isSelf) return s
      return {
        participants: s.participants.filter((p) => p.id !== id),
        messages: [...s.messages, systemMessage(`${gone.name} was removed from the meeting.`)],
      }
    }),

  muteEveryone: () =>
    set((s) => ({
      micOn: false,
      participants: s.participants.map((p) => ({ ...p, micOn: false, speaking: false })),
    })),

  lowerAllHands: () => set((s) => ({ participants: s.participants.map((p) => ({ ...p, handRaised: false })) })),
})
