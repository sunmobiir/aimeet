import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role, Room } from "@/types"

interface SessionState {
  displayName: string
  role: Role
  /** rooms this browser has created — client-side only "directory" */
  rooms: Room[]
  setDisplayName: (name: string) => void
  setRole: (role: Role) => void
  createRoom: (input: { name: string; template: string }) => Room
  removeRoom: (id: string) => void
  findRoom: (idOrCode: string) => Room | undefined
}

function makeCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      displayName: "",
      role: "host",
      rooms: [],

      setDisplayName: (displayName) => set({ displayName }),
      setRole: (role) => set({ role }),

      createRoom: ({ name, template }) => {
        const room: Room = {
          id: crypto.randomUUID().slice(0, 8),
          name: name.trim() || "Untitled meeting",
          code: makeCode(),
          createdAt: Date.now(),
          template,
        }
        set((s) => ({ rooms: [room, ...s.rooms].slice(0, 24) }))
        return room
      },

      removeRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),

      findRoom: (idOrCode) => {
        const needle = idOrCode.trim().toUpperCase()
        return get().rooms.find((r) => r.id.toUpperCase() === needle || r.code === needle)
      },
    }),
    { name: "connectly:session", version: 1 },
  ),
)
