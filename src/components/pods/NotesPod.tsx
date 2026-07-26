import { App, Button, Tooltip, Typography } from "antd"
import { CopyOutlined, DownloadOutlined, FileTextOutlined } from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { clockTime } from "@/lib/format"

const { Text } = Typography

export default function NotesPod({ onClose }: { onClose?: () => void }) {
  const { message } = App.useApp()
  const notes = useMeetingStore((s) => s.notes)
  const notesUpdatedAt = useMeetingStore((s) => s.notesUpdatedAt)
  const setNotes = useMeetingStore((s) => s.setNotes)
  const participants = useMeetingStore((s) => s.participants)
  const roomName = useMeetingStore((s) => s.roomName)

  const self = participants.find((p) => p.isSelf)
  const canEdit = self?.role !== "participant"

  async function copy() {
    try {
      await navigator.clipboard.writeText(notes)
      message.success("Notes copied to clipboard.")
    } catch {
      message.error("Clipboard is unavailable in this context.")
    }
  }

  function download() {
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${roomName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "meeting"}-notes.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PodShell
      title="Shared notes"
      icon={<FileTextOutlined />}
      onClose={onClose}
      flush
      extra={
        <>
          <Tooltip title="Copy notes">
            <Button type="text" size="small" aria-label="Copy notes" icon={<CopyOutlined style={{ fontSize: 12 }} />} onClick={copy} />
          </Tooltip>
          <Tooltip title="Download as .txt">
            <Button
              type="text"
              size="small"
              aria-label="Download notes"
              icon={<DownloadOutlined style={{ fontSize: 12 }} />}
              onClick={download}
            />
          </Tooltip>
        </>
      }
      footer={
        <Text style={{ fontSize: 10.5, color: "var(--app-text-dim)" }}>
          {canEdit ? `Last edited ${clockTime(notesUpdatedAt)}` : "Read-only — presenters and hosts can edit."}
        </Text>
      }
    >
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        readOnly={!canEdit}
        aria-label="Shared meeting notes"
        spellCheck={false}
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          resize: "none",
          border: "none",
          outline: "none",
          padding: 10,
          background: "transparent",
          color: canEdit ? "var(--app-text)" : "var(--app-text-dim)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      />
    </PodShell>
  )
}
