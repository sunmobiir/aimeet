import { create } from "zustand"
import type {
  ChatMessage,
  Layout,
  Participant,
  Poll,
  PodKind,
  QaQuestion,
  QaQuestion as Qa,
  Role,
  SharedFile,
  Stroke,
} from "@/types"
import { AVATAR_COLORS, NAME_POOL, NOTES_SEED, QA_POOL } from "@/lib/seed"

const SELF_ID = "self"

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

function uid() {
  return crypto.randomUUID()
}

function makeParticipant(name: string, role: Role, index: number): Participant {
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

interface MeetingState {
  // ---- room ----
  roomId: string | null
  roomName: string
  roomCode: string
  startedAt: number
  recording: boolean
  locked: boolean
  connection: "excellent" | "good" | "fair"

  // ---- layout ----
  layouts: Layout[]
  activeLayoutId: string
  /** pods force-closed by the local user, per layout */
  closedPods: Record<string, PodKind[]>
  /** pod shown inside the bottom drawer on narrow screens */
  drawerPod: PodKind | null

  // ---- people ----
  participants: Participant[]

  // ---- media ----
  micOn: boolean
  camOn: boolean
  screenSharing: boolean
  cameraStream: MediaStream | null
  screenStream: MediaStream | null
  mediaError: string | null

  // ---- pods content ----
  messages: ChatMessage[]
  unreadChat: number
  questions: QaQuestion[]
  polls: Poll[]
  notes: string
  notesUpdatedAt: number
  strokes: Stroke[]
  files: SharedFile[]

  // ---- slide deck on the share stage ----
  slide: number
  slideCount: number

  // ---- actions ----
  initRoom: (input: { roomId: string; roomName: string; roomCode: string; displayName: string; role: Role; template: string }) => void
  teardown: () => void

  setActiveLayout: (id: string) => void
  addLayout: (name: string) => void
  removeLayout: (id: string) => void
  setLayoutMainSize: (id: string, size: number) => void
  setLayoutMain: (id: string, pod: PodKind) => void
  togglePod: (pod: PodKind) => void
  isPodOpen: (pod: PodKind) => boolean
  openDrawerPod: (pod: PodKind) => void
  closeDrawerPod: () => void

  toggleMic: () => void
  toggleCam: () => void
  setCameraStream: (s: MediaStream | null) => void
  setScreenStream: (s: MediaStream | null) => void
  setScreenSharing: (v: boolean) => void
  setMediaError: (msg: string | null) => void
  toggleRecording: () => void
  toggleLock: () => void
  setConnection: (c: MeetingState["connection"]) => void

  raiseHand: () => void
  setSelfStatus: (status: Participant["status"]) => void
  setParticipantRole: (id: string, role: Role) => void
  muteParticipant: (id: string) => void
  lowerHand: (id: string) => void
  removeParticipant: (id: string) => void
  muteEveryone: () => void
  lowerAllHands: () => void

  sendMessage: (body: string, toId?: string) => void
  clearUnread: () => void
  clearChat: () => void

  askQuestion: (body: string) => void
  voteQuestion: (id: string) => void
  answerQuestion: (id: string, answer: string) => void
  dismissQuestion: (id: string) => void

  createPoll: (input: { question: string; type: Poll["type"]; options: string[] }) => void
  votePoll: (pollId: string, optionIds: string[]) => void
  setPollOpen: (pollId: string, open: boolean) => void
  removePoll: (pollId: string) => void

  setNotes: (value: string) => void

  addStroke: (stroke: Stroke) => void
  undoStroke: () => void
  clearStrokes: () => void

  addFile: (file: SharedFile) => void
  removeFile: (id: string) => void

  setSlide: (n: number) => void

  // ---- simulation hooks ----
  simulateJoin: () => void
  simulateLeave: () => void
  simulateChat: () => void
  simulateQuestion: () => void
  simulateActivity: () => void
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  roomId: null,
  roomName: "",
  roomCode: "",
  startedAt: Date.now(),
  recording: false,
  locked: false,
  connection: "excellent",

  layouts: DEFAULT_LAYOUTS,
  activeLayoutId: "sharing",
  closedPods: {},
  drawerPod: null,

  participants: [],

  micOn: false,
  camOn: false,
  screenSharing: false,
  cameraStream: null,
  screenStream: null,
  mediaError: null,

  messages: [],
  unreadChat: 0,
  questions: [],
  polls: [],
  notes: NOTES_SEED,
  notesUpdatedAt: Date.now(),
  strokes: [],
  files: [],

  slide: 1,
  slideCount: 12,

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

    const initialLayout = template === "collaboration" ? "collaboration" : template === "webinar" ? "sharing" : "sharing"

    set({
      roomId,
      roomName,
      roomCode,
      startedAt: Date.now(),
      recording: false,
      locked: false,
      participants: [self, ...others],
      activeLayoutId: initialLayout,
      layouts: DEFAULT_LAYOUTS,
      closedPods: {},
      drawerPod: null,
      micOn: false,
      camOn: false,
      screenSharing: false,
      cameraStream: null,
      screenStream: null,
      mediaError: null,
      messages: [
        {
          id: uid(),
          authorId: "system",
          authorName: "System",
          body: `Meeting room "${roomName}" opened. You joined as ${role}.`,
          at: Date.now(),
          system: true,
        },
      ],
      unreadChat: 0,
      questions:
        template === "webinar"
          ? QA_POOL.slice(0, 3).map((body, i) => ({
              id: uid(),
              authorId: others[i]?.id ?? "guest",
              authorName: others[i]?.name ?? "Guest",
              body,
              at: Date.now() - i * 60_000,
              votes: Math.floor(Math.random() * 9),
              votedBySelf: false,
              answered: false,
            }))
          : [],
      polls: [],
      notes: NOTES_SEED,
      strokes: [],
      files: [],
      slide: 1,
    })
  },

  teardown: () => {
    const { cameraStream, screenStream } = get()
    cameraStream?.getTracks().forEach((t) => t.stop())
    screenStream?.getTracks().forEach((t) => t.stop())
    set({
      roomId: null,
      drawerPod: null,
      participants: [],
      cameraStream: null,
      screenStream: null,
      camOn: false,
      micOn: false,
      screenSharing: false,
      recording: false,
      messages: [],
      questions: [],
      polls: [],
      strokes: [],
      files: [],
    })
  },

  // ---- layout ----
  setActiveLayout: (activeLayoutId) => set({ activeLayoutId, drawerPod: null }),

  addLayout: (name) => {
    const id = `custom-${Date.now().toString(36)}`
    set((s) => ({
      layouts: [
        ...s.layouts,
        { id, name: name.trim() || `Layout ${s.layouts.length + 1}`, main: "share", side: ["video", "attendees", "chat"], mainSize: 72 },
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

  setLayoutMain: (id, pod) =>
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.id === id ? { ...l, main: pod, side: l.side.filter((p) => p !== pod) } : l,
      ),
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
        layouts: inLayout
          ? s.layouts
          : s.layouts.map((l) => (l.id === layout.id ? { ...l, side: [...l.side, pod] } : l)),
        closedPods:
          layout && (s.closedPods[layout.id] ?? []).includes(pod)
            ? { ...s.closedPods, [layout.id]: s.closedPods[layout.id].filter((p) => p !== pod) }
            : s.closedPods,
      }
    }),

  closeDrawerPod: () => set({ drawerPod: null }),

  // ---- media ----
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
  toggleRecording: () => set((s) => ({ recording: !s.recording })),
  toggleLock: () => set((s) => ({ locked: !s.locked })),
  setConnection: (connection) => set({ connection }),

  // ---- people ----
  raiseHand: () =>
    set((s) => ({
      participants: s.participants.map((p) => (p.isSelf ? { ...p, handRaised: !p.handRaised } : p)),
    })),

  setSelfStatus: (status) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.isSelf ? { ...p, status: p.status === status ? null : status } : p,
      ),
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
        messages: [
          ...s.messages,
          {
            id: uid(),
            authorId: "system",
            authorName: "System",
            body: `${gone.name} was removed from the meeting.`,
            at: Date.now(),
            system: true,
          },
        ],
      }
    }),

  muteEveryone: () =>
    set((s) => ({
      micOn: false,
      participants: s.participants.map((p) => ({ ...p, micOn: false, speaking: false })),
    })),

  lowerAllHands: () =>
    set((s) => ({ participants: s.participants.map((p) => ({ ...p, handRaised: false })) })),

  // ---- chat ----
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
      messages: [
        {
          id: uid(),
          authorId: "system",
          authorName: "System",
          body: "Chat history was cleared by the host.",
          at: Date.now(),
          system: true,
        },
      ],
      unreadChat: 0,
    }),

  // ---- Q&A ----
  askQuestion: (body) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const self = get().participants.find((p) => p.isSelf)
    set((s) => ({
      questions: [
        {
          id: uid(),
          authorId: SELF_ID,
          authorName: self?.name ?? "You",
          body: trimmed,
          at: Date.now(),
          votes: 0,
          votedBySelf: false,
          answered: false,
        },
        ...s.questions,
      ],
    }))
  },

  voteQuestion: (id) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === id
          ? { ...q, votes: q.votedBySelf ? q.votes - 1 : q.votes + 1, votedBySelf: !q.votedBySelf }
          : q,
      ),
    })),

  answerQuestion: (id, answer) =>
    set((s) => ({
      questions: s.questions.map((q) => (q.id === id ? { ...q, answered: true, answer } : q)),
    })),

  dismissQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),

  // ---- polls ----
  createPoll: ({ question, type, options }) => {
    const clean = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || clean.length < 2) return
    const poll: Poll = {
      id: uid(),
      question: question.trim(),
      type,
      options: clean.map((label) => ({ id: uid(), label, votes: 0 })),
      open: true,
      createdAt: Date.now(),
      myVotes: [],
    }
    set((s) => ({ polls: [poll, ...s.polls] }))
  },

  votePoll: (pollId, optionIds) =>
    set((s) => ({
      polls: s.polls.map((p) => {
        if (p.id !== pollId) return p
        const options = p.options.map((o) => {
          const was = p.myVotes.includes(o.id)
          const now = optionIds.includes(o.id)
          if (was === now) return o
          return { ...o, votes: Math.max(0, o.votes + (now ? 1 : -1)) }
        })
        return { ...p, options, myVotes: optionIds }
      }),
    })),

  setPollOpen: (pollId, open) =>
    set((s) => ({ polls: s.polls.map((p) => (p.id === pollId ? { ...p, open } : p)) })),

  removePoll: (pollId) => set((s) => ({ polls: s.polls.filter((p) => p.id !== pollId) })),

  // ---- notes ----
  setNotes: (notes) => set({ notes, notesUpdatedAt: Date.now() }),

  // ---- whiteboard ----
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  undoStroke: () =>
    set((s) => {
      // Undo only removes the local user's most recent stroke.
      const lastSelf = [...s.strokes].reverse().find((st) => st.authorId === SELF_ID)
      if (!lastSelf) return s
      return { strokes: s.strokes.filter((st) => st.id !== lastSelf.id) }
    }),
  clearStrokes: () => set({ strokes: [] }),

  // ---- files ----
  addFile: (file) => set((s) => ({ files: [file, ...s.files] })),
  removeFile: (id) =>
    set((s) => {
      const f = s.files.find((x) => x.id === id)
      if (f?.url) URL.revokeObjectURL(f.url)
      return { files: s.files.filter((x) => x.id !== id) }
    }),

  setSlide: (n) => set((s) => ({ slide: Math.min(Math.max(1, n), s.slideCount) })),

  // ---- simulation ----
  simulateJoin: () =>
    set((s) => {
      if (s.locked || s.participants.length >= 16) return s
      const taken = new Set(s.participants.map((p) => p.name))
      const available = NAME_POOL.filter((n) => !taken.has(n))
      if (!available.length) return s
      const name = available[Math.floor(Math.random() * available.length)]
      const p = makeParticipant(name, "participant", s.participants.length)
      p.joinedAt = Date.now()
      return {
        participants: [...s.participants, p],
        messages: [
          ...s.messages,
          {
            id: uid(),
            authorId: "system",
            authorName: "System",
            body: `${name} joined the meeting.`,
            at: Date.now(),
            system: true,
          },
        ],
      }
    }),

  simulateLeave: () =>
    set((s) => {
      const candidates = s.participants.filter((p) => !p.isSelf && p.role === "participant")
      if (candidates.length <= 2) return s
      const gone = candidates[Math.floor(Math.random() * candidates.length)]
      return {
        participants: s.participants.filter((p) => p.id !== gone.id),
        messages: [
          ...s.messages,
          {
            id: uid(),
            authorId: "system",
            authorName: "System",
            body: `${gone.name} left the meeting.`,
            at: Date.now(),
            system: true,
          },
        ],
      }
    }),

  simulateChat: () => {
    // implemented in lib/simulation to keep message pool logic out of the store
  },

  simulateQuestion: () =>
    set((s) => {
      const candidates = s.participants.filter((p) => !p.isSelf)
      if (!candidates.length) return s
      const asker = candidates[Math.floor(Math.random() * candidates.length)]
      const asked = new Set(s.questions.map((q) => q.body))
      const available = QA_POOL.filter((q) => !asked.has(q))
      if (!available.length) return s
      const body = available[Math.floor(Math.random() * available.length)]
      const q: Qa = {
        id: uid(),
        authorId: asker.id,
        authorName: asker.name,
        body,
        at: Date.now(),
        votes: 0,
        votedBySelf: false,
        answered: false,
      }
      return { questions: [q, ...s.questions] }
    }),

  simulateActivity: () =>
    set((s) => {
      const speakerIndex = Math.random() > 0.25 ? Math.floor(Math.random() * s.participants.length) : -1
      return {
        participants: s.participants.map((p, i) => {
          if (p.isSelf) return { ...p, speaking: p.micOn && Math.random() > 0.6 }
          const drift = Math.random() * 12 - 6
          return {
            ...p,
            speaking: i === speakerIndex && p.micOn,
            engagement: Math.min(100, Math.max(20, Math.round(p.engagement + drift))),
            handRaised: Math.random() > 0.97 ? !p.handRaised : p.handRaised,
          }
        }),
      }
    }),
}))

export { SELF_ID }
