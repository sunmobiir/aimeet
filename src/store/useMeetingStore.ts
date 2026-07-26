import { create } from "zustand"
import type { MeetingState } from "./meetingState"
import { createRoomSlice } from "./slices/roomSlice"
import { createLayoutSlice } from "./slices/layoutSlice"
import { createMediaSlice } from "./slices/mediaSlice"
import { createAttendeesSlice } from "./slices/attendeesSlice"
import { createChatSlice } from "./slices/chatSlice"
import { createQaSlice } from "./slices/qaSlice"
import { createPollSlice } from "./slices/pollSlice"
import { createNotesSlice } from "./slices/notesSlice"
import { createWhiteboardSlice } from "./slices/whiteboardSlice"
import { createFilesSlice } from "./slices/filesSlice"
import { createShareSlice } from "./slices/shareSlice"
import { createSimulationSlice } from "./slices/simulationSlice"

export const useMeetingStore = create<MeetingState>()((...a) => ({
  ...createRoomSlice(...a),
  ...createLayoutSlice(...a),
  ...createMediaSlice(...a),
  ...createAttendeesSlice(...a),
  ...createChatSlice(...a),
  ...createQaSlice(...a),
  ...createPollSlice(...a),
  ...createNotesSlice(...a),
  ...createWhiteboardSlice(...a),
  ...createFilesSlice(...a),
  ...createShareSlice(...a),
  ...createSimulationSlice(...a),
}))

export type { MeetingState }
export { SELF_ID } from "./shared"
export { DEFAULT_LAYOUTS } from "./slices/layoutSlice"
