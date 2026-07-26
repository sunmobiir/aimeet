import type { ChatMessage, Participant, Role } from "@/types"
import { AVATAR_COLORS } from "@/lib/seed"

/** Id used for the local user everywhere in the store. */
export const SELF_ID = "self"

export function uid() {
  return crypto.randomUUID()
}

export function makeParticipant(name: string, role: Role, index: number): Participant {
  return {
    id: uid(),
    name,
    role,
    isSelf: false,
    micOn: role !== "participant" ? Math.random() > 0.4 : false,
    camOn: Math.random() > 0.55,
    handRaised: false,
    speaking: false,
    engagement: 55 + Math.floor(Math.random() * 45),
    status: null,
    joinedAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 12),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
  }
}

export function systemMessage(body: string): ChatMessage {
  return {
    id: uid(),
    authorId: "system",
    authorName: "System",
    body,
    at: Date.now(),
    system: true,
  }
}
