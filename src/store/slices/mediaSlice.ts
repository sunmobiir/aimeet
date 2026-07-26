import type { StateCreator } from "zustand"
import type { MeetingState } from "../meetingState"

export interface MediaSlice {
  micOn: boolean
  camOn: boolean
  screenSharing: boolean
  cameraStream: MediaStream | null
  screenStream: MediaStream | null
  mediaError: string | null

  toggleMic: () => void
  toggleCam: () => void
  setCameraStream: (s: MediaStream | null) => void
  setScreenStream: (s: MediaStream | null) => void
  setScreenSharing: (v: boolean) => void
  setMediaError: (msg: string | null) => void
}

export const initialMediaState = {
  micOn: false,
  camOn: false,
  screenSharing: false,
  cameraStream: null as MediaStream | null,
  screenStream: null as MediaStream | null,
  mediaError: null as string | null,
}

export const createMediaSlice: StateCreator<MeetingState, [], [], MediaSlice> = (set) => ({
  ...initialMediaState,

  toggleMic: () =>
    set((s) => {
      const micOn = !s.micOn
      s.cameraStream?.getAudioTracks().forEach((t) => {
        t.enabled = micOn
      })
      return {
        micOn,
        participants: s.participants.map((p) => (p.isSelf ? { ...p, micOn } : p)),
      }
    }),

  toggleCam: () => set((s) => ({ camOn: !s.camOn })),

  setCameraStream: (cameraStream) =>
    set((s) => {
      const camOn = !!cameraStream
      return {
        cameraStream,
        camOn,
        participants: s.participants.map((p) => (p.isSelf ? { ...p, camOn } : p)),
      }
    }),

  setScreenStream: (screenStream) => set({ screenStream }),
  setScreenSharing: (screenSharing) => set({ screenSharing }),
  setMediaError: (mediaError) => set({ mediaError }),
})
