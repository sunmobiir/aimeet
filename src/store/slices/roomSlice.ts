import type { StateCreator } from "zustand"
import type { Participant, Role } from "@/types"
import type { MeetingState } from "../meetingState"
import { SELF_ID, makeParticipant } from "../shared"
import { NAME_POOL } from "@/lib/seed"
import { initialAttendeesState } from "./attendeesSlice"
import { chatRoomState, initialChatState } from "./chatSlice"
import { initialFilesState } from "./filesSlice"
import { layoutRoomState } from "./layoutSlice"
import { initialMediaState } from "./mediaSlice"
import { initialNotesState } from "./notesSlice"
import { initialPollState } from "./pollSlice"
import { initialQaState, qaRoomState } from "./qaSlice"
import { initialShareState } from "./shareSlice"
import { initialWhiteboardState } from "./whiteboardSlice"

export interface RoomSlice {
  roomId: string | null
  roomName: string
  roomCode: string
  startedAt: number
  recording: boolean
  locked: boolean
  connection: "excellent" | "good" | "fair"

  initRoom: (input: {
    roomId: string
    roomName: string
    roomCode: string
    displayName: string
    role: Role
    template: string
  }) => void
  teardown: () => void
  toggleRecording: () => void
  toggleLock: () => void
  setConnection: (c: RoomSlice["connection"]) => void
}

export const initialRoomState = {
  roomId: null as string | null,
  roomName: "",
  roomCode: "",
  startedAt: Date.now(),
  recording: false,
  locked: false,
  connection: "excellent" as RoomSlice["connection"],
}

export const createRoomSlice: StateCreator<MeetingState, [], [], RoomSlice> = (set, get) => ({
  ...initialRoomState,

  initRoom: ({ roomId, roomName, roomCode, displayName, role, template }) => {
    const self: Participant = {
      id: SELF_ID,
      name: displayName || "You",
      role,
      isSelf: true,
      micOn: false,
      camOn: false,
      handRaised: false,
      speaking: false,
      engagement: 100,
      status: null,
      joinedAt: Date.now(),
      color: "#17a2a2",
    }

    // Seed a believable room: one other host/presenter + a handful of attendees.
    const count = template === "webinar" ? 9 : template === "training" ? 6 : 4
    const shuffled = [...NAME_POOL].sort(() => Math.random() - 0.5)
    const others = shuffled.slice(0, count).map((name, i) => {
      const p = makeParticipant(name, i === 0 ? "presenter" : "participant", i + 1)
      if (i === 0) p.micOn = true
      return p
    })

    set({
      roomId,
      roomName,
      roomCode,
      startedAt: Date.now(),
      recording: false,
      locked: false,
      ...layoutRoomState(template),
      ...initialMediaState,
      participants: [self, ...others],
      ...chatRoomState(roomName, role),
      ...qaRoomState(template, others),
      ...initialPollState,
      ...initialNotesState,
      ...initialWhiteboardState,
      ...initialFilesState,
      ...initialShareState,
    })
  },

  teardown: () => {
    const { cameraStream, screenStream } = get()
    cameraStream?.getTracks().forEach((t) => t.stop())
    screenStream?.getTracks().forEach((t) => t.stop())
    set({
      roomId: null,
      recording: false,
      drawerPod: null,
      ...initialAttendeesState,
      ...initialMediaState,
      ...initialChatState,
      ...initialQaState,
      ...initialPollState,
      ...initialWhiteboardState,
      ...initialFilesState,
    })
  },

  toggleRecording: () => set((s) => ({ recording: !s.recording })),
  toggleLock: () => set((s) => ({ locked: !s.locked })),
  setConnection: (connection) => set({ connection }),
})
