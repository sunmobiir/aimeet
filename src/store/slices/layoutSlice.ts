import type { StateCreator } from "zustand"
import type { Layout, PodKind } from "@/types"
import type { MeetingState } from "../meetingState"

export const DEFAULT_LAYOUTS: Layout[] = [
  {
    id: "sharing",
    name: "Sharing",
    main: "share",
    side: ["video", "attendees", "chat"],
    mainSize: 74,
  },
  {
    id: "discussion",
    name: "Discussion",
    main: "video",
    side: ["attendees", "chat", "poll"],
    mainSize: 66,
  },
  {
    id: "collaboration",
    name: "Collaboration",
    main: "whiteboard",
    side: ["video", "notes", "chat"],
    mainSize: 70,
  },
  {
    id: "qa",
    name: "Q&A",
    main: "qa",
    side: ["video", "attendees", "chat"],
    mainSize: 64,
  },
]

export interface LayoutSlice {
  layouts: Layout[]
  activeLayoutId: string
  /** pods force-closed by the local user, per layout */
  closedPods: Record<string, PodKind[]>
  /** pod shown inside the bottom drawer on narrow screens */
  drawerPod: PodKind | null

  setActiveLayout: (id: string) => void
  addLayout: (name: string) => void
  removeLayout: (id: string) => void
  setLayoutMainSize: (id: string, size: number) => void
  /** merge flex weights for side pods (used by the splitters between pods) */
  setLayoutSideSizes: (id: string, sizes: Partial<Record<PodKind, number>>) => void
  /** drop custom weights so the side pods share the rail evenly again */
  resetLayoutSideSizes: (id: string) => void
  setLayoutMain: (id: string, pod: PodKind) => void
  togglePod: (pod: PodKind) => void
  isPodOpen: (pod: PodKind) => boolean
  openDrawerPod: (pod: PodKind) => void
  closeDrawerPod: () => void
}

export const initialLayoutState = {
  layouts: DEFAULT_LAYOUTS,
  activeLayoutId: "sharing",
  closedPods: {} as Record<string, PodKind[]>,
  drawerPod: null as PodKind | null,
}

/** State the layout slice owns when a room boots up. */
export function layoutRoomState(template: string) {
  return {
    ...initialLayoutState,
    activeLayoutId: template === "collaboration" ? "collaboration" : "sharing",
  }
}

export const createLayoutSlice: StateCreator<MeetingState, [], [], LayoutSlice> = (set, get) => ({
  ...initialLayoutState,

  setActiveLayout: (activeLayoutId) => set({ activeLayoutId, drawerPod: null }),

  addLayout: (name) => {
    const id = `custom-${Date.now().toString(36)}`
    set((s) => ({
      layouts: [
        ...s.layouts,
        {
          id,
          name: name.trim() || `Layout ${s.layouts.length + 1}`,
          main: "share",
          side: ["video", "attendees", "chat"],
          mainSize: 72,
        },
      ],
      activeLayoutId: id,
    }))
  },

  removeLayout: (id) =>
    set((s) => {
      if (s.layouts.length <= 1) return s
      const layouts = s.layouts.filter((l) => l.id !== id)
      return {
        layouts,
        activeLayoutId: s.activeLayoutId === id ? layouts[0].id : s.activeLayoutId,
      }
    }),

  setLayoutMainSize: (id, size) =>
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === id ? { ...l, mainSize: Math.round(size) } : l)),
    })),

  setLayoutSideSizes: (id, sizes) =>
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.id === id ? { ...l, sideSizes: { ...(l.sideSizes ?? {}), ...sizes } } : l,
      ),
    })),

  resetLayoutSideSizes: (id) =>
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === id ? { ...l, sideSizes: {} } : l)),
    })),

  setLayoutMain: (id, pod) =>
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === id ? { ...l, main: pod, side: l.side.filter((p) => p !== pod) } : l)),
    })),

  togglePod: (pod) =>
    set((s) => {
      const layout = s.layouts.find((l) => l.id === s.activeLayoutId)
      if (!layout) return s
      const closed = s.closedPods[layout.id] ?? []
      const isClosed = closed.includes(pod)

      // Pod not part of this layout at all → add it to the side rail.
      const inLayout = layout.main === pod || layout.side.includes(pod)
      if (!inLayout) {
        return {
          layouts: s.layouts.map((l) => (l.id === layout.id ? { ...l, side: [...l.side, pod] } : l)),
          closedPods: { ...s.closedPods, [layout.id]: closed.filter((p) => p !== pod) },
        }
      }

      return {
        closedPods: {
          ...s.closedPods,
          [layout.id]: isClosed ? closed.filter((p) => p !== pod) : [...closed, pod],
        },
      }
    }),

  isPodOpen: (pod) => {
    const s = get()
    const layout = s.layouts.find((l) => l.id === s.activeLayoutId)
    if (!layout) return false
    const inLayout = layout.main === pod || layout.side.includes(pod)
    if (!inLayout) return false
    return !(s.closedPods[layout.id] ?? []).includes(pod)
  },

  openDrawerPod: (pod) =>
    set((s) => {
      const layout = s.layouts.find((l) => l.id === s.activeLayoutId)
      // Make sure the pod belongs to the layout so desktop keeps it after resize.
      const inLayout = !layout || layout.main === pod || layout.side.includes(pod)
      return {
        drawerPod: pod,
        layouts: inLayout ? s.layouts : s.layouts.map((l) => (l.id === layout!.id ? { ...l, side: [...l.side, pod] } : l)),
        closedPods:
          layout && (s.closedPods[layout.id] ?? []).includes(pod)
            ? { ...s.closedPods, [layout.id]: s.closedPods[layout.id].filter((p) => p !== pod) }
            : s.closedPods,
      }
    }),

  closeDrawerPod: () => set({ drawerPod: null }),
})
