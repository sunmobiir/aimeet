export type Role = "host" | "presenter" | "participant"

export type PodKind =
  | "share"
  | "video"
  | "attendees"
  | "chat"
  | "notes"
  | "poll"
  | "qa"
  | "whiteboard"
  | "files"

export type LayoutId = string

export interface Participant {
  id: string
  name: string
  role: Role
  isSelf: boolean
  micOn: boolean
  camOn: boolean
  handRaised: boolean
  speaking: boolean
  /** 0-100, drives the agree/disagree + engagement meter */
  engagement: number
  status: null | "agree" | "disagree" | "stepped-away" | "speak-louder" | "slower" | "faster"
  joinedAt: number
  color: string
}

export interface ChatMessage {
  id: string
  authorId: string
  authorName: string
  body: string
  at: number
  /** undefined = "Everyone" */
  toId?: string
  toName?: string
  system?: boolean
}

export interface QaQuestion {
  id: string
  authorId: string
  authorName: string
  body: string
  at: number
  votes: number
  votedBySelf: boolean
  answered: boolean
  answer?: string
}

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  type: "multiple-choice" | "multiple-answers"
  options: PollOption[]
  open: boolean
  createdAt: number
  /** option ids the local user picked */
  myVotes: string[]
}

export interface Stroke {
  id: string
  authorId: string
  color: string
  width: number
  tool: "pen" | "highlighter" | "eraser"
  points: { x: number; y: number }[]
}

export interface SharedFile {
  id: string
  name: string
  size: number
  uploadedBy: string
  at: number
  url?: string
}

export interface Layout {
  id: LayoutId
  name: string
  /** left column pods, top-to-bottom */
  main: PodKind
  side: PodKind[]
  /** percentage width of the main stage */
  mainSize: number
  /** flex-grow weight per side pod, set by dragging the splitters between pods */
  sideSizes?: Partial<Record<PodKind, number>>
}

export interface Room {
  id: string
  name: string
  code: string
  createdAt: number
  template: string
}
