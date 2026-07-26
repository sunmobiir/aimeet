import type { AttendeesSlice } from "./slices/attendeesSlice"
import type { ChatSlice } from "./slices/chatSlice"
import type { FilesSlice } from "./slices/filesSlice"
import type { LayoutSlice } from "./slices/layoutSlice"
import type { MediaSlice } from "./slices/mediaSlice"
import type { NotesSlice } from "./slices/notesSlice"
import type { PollSlice } from "./slices/pollSlice"
import type { QaSlice } from "./slices/qaSlice"
import type { RoomSlice } from "./slices/roomSlice"
import type { ShareSlice } from "./slices/shareSlice"
import type { SimulationSlice } from "./slices/simulationSlice"
import type { WhiteboardSlice } from "./slices/whiteboardSlice"

/**
 * The full meeting store: one slice per concern, one slice per pod.
 * Slice implementations live in `src/store/slices/*`.
 */
export type MeetingState = RoomSlice &
  LayoutSlice &
  MediaSlice &
  AttendeesSlice &
  ChatSlice &
  QaSlice &
  PollSlice &
  NotesSlice &
  WhiteboardSlice &
  FilesSlice &
  ShareSlice &
  SimulationSlice
