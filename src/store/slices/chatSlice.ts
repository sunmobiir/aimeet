import type { StateCreator } from "zustand"
import type { ChatMessage, Role } from "@/types"
import type { MeetingState } from "../meetingState"
import { SELF_ID, systemMessage, uid } from "../shared"

/** Backing store for the Chat pod. */
export interface ChatSlice {
  messages: ChatMessage[]
  unreadChat: number

  sendMessage: (body: string, toId?: string) => void
  clearUnread: () => void
  clearChat: () => void
}

export const initialChatState = {
  messages: [] as ChatMessage[],
  unreadChat: 0,
}

export function chatRoomState(roomName: string, role: Role) {
  return {
    messages: [systemMessage(`Meeting room "${roomName}" opened. You joined as ${role}.`)],
    unreadChat: 0,
  }
}

export const createChatSlice: StateCreator<MeetingState, [], [], ChatSlice> = (set, get) => ({
  ...initialChatState,

  sendMessage: (body, toId) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const to = toId ? get().participants.find((p) => p.id === toId) : undefined
    const self = get().participants.find((p) => p.isSelf)
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: uid(),
          authorId: SELF_ID,
          authorName: self?.name ?? "You",
          body: trimmed,
          at: Date.now(),
          toId,
          toName: to?.name,
        },
      ],
    }))
  },

  clearUnread: () => set({ unreadChat: 0 }),

  clearChat: () =>
    set({
      messages: [systemMessage("Chat history was cleared by the host.")],
      unreadChat: 0,
    }),
})
