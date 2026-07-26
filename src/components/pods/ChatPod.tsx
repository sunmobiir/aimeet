import { useEffect, useRef, useState } from "react"
import { App, Avatar, Button, Dropdown, Input, Select, Space, Tag, Typography } from "antd"
import { ClearOutlined, MessageOutlined, MoreOutlined, SendOutlined } from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { clockTime, initials } from "@/lib/format"

const { Text } = Typography

export default function ChatPod({ onClose }: { onClose?: () => void }) {
  const { modal } = App.useApp()
  const messages = useMeetingStore((s) => s.messages)
  const participants = useMeetingStore((s) => s.participants)
  const sendMessage = useMeetingStore((s) => s.sendMessage)
  const clearChat = useMeetingStore((s) => s.clearChat)
  const clearUnread = useMeetingStore((s) => s.clearUnread)

  const [draft, setDraft] = useState("")
  const [target, setTarget] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  const self = participants.find((p) => p.isSelf)
  const isHost = self?.role === "host"

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  useEffect(() => {
    clearUnread()
  }, [messages.length, clearUnread])

  function submit() {
    if (!draft.trim()) return
    sendMessage(draft, target)
    setDraft("")
  }

  return (
    <PodShell
      title="Chat"
      icon={<MessageOutlined />}
      onClose={onClose}
      flush
      extra={
        isHost ? (
          <Dropdown
            trigger={["click"]}
            menu={{
              onClick: ({ key }) => {
                if (key === "clear") {
                  modal.confirm({
                    title: "Clear chat history?",
                    content: "The transcript will be removed for everyone in the room.",
                    okText: "Clear",
                    okButtonProps: { danger: true },
                    onOk: clearChat,
                  })
                }
              },
              items: [{ key: "clear", label: "Clear history", icon: <ClearOutlined />, danger: true }],
            }}
          >
            <Button type="text" size="small" aria-label="Chat options" icon={<MoreOutlined style={{ fontSize: 12 }} />} />
          </Dropdown>
        ) : undefined
      }
      footer={
        <Space.Compact style={{ width: "100%" }}>
          <Select
            size="small"
            value={target ?? "everyone"}
            onChange={(v) => setTarget(v === "everyone" ? undefined : v)}
            style={{ width: 108, flex: "none" }}
            aria-label="Message recipient"
            options={[
              { value: "everyone", label: "Everyone" },
              ...participants
                .filter((p) => !p.isSelf)
                .map((p) => ({ value: p.id, label: p.name.split(" ")[0] })),
            ]}
          />
          <Input
            size="small"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Don't submit mid-IME composition (CJK input).
              if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              submit()
            }}
            placeholder={target ? "Private message…" : "Message everyone…"}
            maxLength={500}
          />
          <Button
            size="small"
            type="primary"
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="Send message"
            icon={<SendOutlined />}
          />
        </Space.Compact>
      }
    >
      <div ref={scrollRef} className="app-scroll-y" style={{ flex: 1, padding: 10 }}>
        {messages.map((m) => {
          if (m.system) {
            return (
              <div key={m.id} className="chat-row" style={{ textAlign: "center" }}>
                <Text style={{ fontSize: 10.5, color: "var(--app-text-dim)", fontStyle: "italic" }}>{m.body}</Text>
              </div>
            )
          }

          const author = participants.find((p) => p.id === m.authorId)
          const mine = m.authorId === "self"

          return (
            <div key={m.id} className="chat-row" style={{ display: "flex", gap: 7 }}>
              <Avatar
                size={22}
                style={{
                  flex: "none",
                  marginTop: 1,
                  background: mine ? "var(--app-accent)" : author?.color ?? "#232b35",
                  color: "#03211f",
                  fontSize: 9.5,
                  fontWeight: 700,
                }}
              >
                {initials(m.authorName)}
              </Avatar>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <Text strong style={{ fontSize: 12 }}>
                    {mine ? "You" : m.authorName}
                  </Text>
                  {m.toName && (
                    <Tag color="magenta" style={{ margin: 0, fontSize: 9.5, lineHeight: "14px", padding: "0 4px" }}>
                      private → {m.toName.split(" ")[0]}
                    </Tag>
                  )}
                  <Text style={{ fontSize: 10, color: "var(--app-text-dim)" }}>{clockTime(m.at)}</Text>
                </div>
                <Text style={{ fontSize: 12.5, color: "var(--app-text)", wordBreak: "break-word" }}>{m.body}</Text>
              </div>
            </div>
          )
        })}
      </div>
    </PodShell>
  )
}
