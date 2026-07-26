import type { ReactNode } from "react"
import {
  CommentOutlined,
  DesktopOutlined,
  EditOutlined,
  FileOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import type { PodKind } from "@/types"
import AttendeesPod from "@/components/pods/AttendeesPod"
import ChatPod from "@/components/pods/ChatPod"
import FilesPod from "@/components/pods/FilesPod"
import NotesPod from "@/components/pods/NotesPod"
import PollPod from "@/components/pods/PollPod"
import QaPod from "@/components/pods/QaPod"
import SharePod from "@/components/pods/SharePod"
import VideoPod from "@/components/pods/VideoPod"
import WhiteboardPod from "@/components/pods/WhiteboardPod"

export const POD_META: Record<PodKind, { label: string; icon: ReactNode }> = {
  share: { label: "Share", icon: <DesktopOutlined /> },
  video: { label: "Video", icon: <VideoCameraOutlined /> },
  attendees: { label: "Attendees", icon: <TeamOutlined /> },
  chat: { label: "Chat", icon: <CommentOutlined /> },
  notes: { label: "Notes", icon: <FileTextOutlined /> },
  poll: { label: "Polls", icon: <BarChartOutlined /> },
  qa: { label: "Q&A", icon: <QuestionCircleOutlined /> },
  whiteboard: { label: "Whiteboard", icon: <EditOutlined /> },
  files: { label: "Files", icon: <FileOutlined /> },
}

export const ALL_PODS: PodKind[] = [
  "share",
  "video",
  "attendees",
  "chat",
  "notes",
  "poll",
  "qa",
  "whiteboard",
  "files",
]

export function renderPod(kind: PodKind, onClose?: () => void) {
  switch (kind) {
    case "share":
      return <SharePod onClose={onClose} />
    case "video":
      return <VideoPod onClose={onClose} />
    case "attendees":
      return <AttendeesPod onClose={onClose} />
    case "chat":
      return <ChatPod onClose={onClose} />
    case "notes":
      return <NotesPod onClose={onClose} />
    case "poll":
      return <PollPod onClose={onClose} />
    case "qa":
      return <QaPod onClose={onClose} />
    case "whiteboard":
      return <WhiteboardPod onClose={onClose} />
    case "files":
      return <FilesPod onClose={onClose} />
    default:
      return null
  }
}
