import type { StateCreator } from "zustand"
import type { SharedFile } from "@/types"
import type { MeetingState } from "../meetingState"

/** Backing store for the Files pod. */
export interface FilesSlice {
  files: SharedFile[]

  addFile: (file: SharedFile) => void
  removeFile: (id: string) => void
}

export const initialFilesState = {
  files: [] as SharedFile[],
}

export const createFilesSlice: StateCreator<MeetingState, [], [], FilesSlice> = (set) => ({
  ...initialFilesState,

  addFile: (file) => set((s) => ({ files: [file, ...s.files] })),

  removeFile: (id) =>
    set((s) => {
      const f = s.files.find((x) => x.id === id)
      if (f?.url) URL.revokeObjectURL(f.url)
      return { files: s.files.filter((x) => x.id !== id) }
    }),
})
