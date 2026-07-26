import { useMemo, useState } from "react"
import { App, Avatar, Button, Dropdown, Input, Progress, Space, Tag, Tooltip, Typography } from "antd"
import {
  AudioMutedOutlined,
  AudioOutlined,
  CrownOutlined,
  DownOutlined,
  MoreOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { initials } from "@/lib/format"
import type { Participant, Role } from "@/types"

const { Text } = Typography

const ROLE_META: Record<Role, { label: string; color: string; icon: React.ReactNode }> = {
  host: { label: "Host", color: "gold", icon: <CrownOutlined /> },
  presenter: { label: "Presenter", color: "cyan", icon: <VideoCameraOutlined /> },
  participant: { label: "Participant", color: "default", icon: <UserOutlined /> },
}

const STATUS_LABEL: Record<string, string> = {
  agree: "Agrees",
  disagree: "Disagrees",
  "stepped-away": "Stepped away",
  "speak-louder": "Speak louder",
  slower: "Slow down",
  faster: "Speed up",
}

function Row({
  p,
  canManage,
  onAction,
}: {
  p: Participant
  canManage: boolean
  onAction: (action: string, p: Participant) => void
}) {
  const meta = ROLE_META[p.role]

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 4px",
        borderRadius: 6,
        background: p.speaking ? "rgb(23 162 162 / 10%)" : undefined,
      }}
    >
      <Avatar
        size={26}
        style={{
          background: p.role === "participant" ? "#232b35" : p.color,
          color: p.role === "participant" ? "var(--app-text-dim)" : "#03211f",
          fontSize: 11,
          fontWeight: 700,
          flex: "none",
        }}
      >
        {initials(p.name)}
      </Avatar>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Text style={{ fontSize: 12.5, fontWeight: p.isSelf ? 600 : 400 }} className="truncate">
            {p.name}
            {p.isSelf && " (you)"}
          </Text>
          {p.handRaised && (
            <Tooltip title="Hand raised">
              <span style={{ fontSize: 11 }} role="img" aria-label="Hand raised">
                ✋
              </span>
            </Tooltip>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag
            color={meta.color}
            style={{ margin: 0, fontSize: 10, lineHeight: "15px", padding: "0 4px", borderRadius: 3 }}
          >
            {meta.label}
          </Tag>
          {p.status && (
            <Text style={{ fontSize: 10, color: "var(--app-warning)" }} className="truncate">
              {STATUS_LABEL[p.status]}
            </Text>
          )}
        </div>
      </div>

      <Tooltip title={`Engagement ${p.engagement}%`}>
        <Progress
          type="dashboard"
          percent={p.engagement}
          size={20}
          showInfo={false}
          strokeWidth={14}
          strokeColor={p.engagement > 70 ? "#4f9e5e" : p.engagement > 45 ? "#d9a13b" : "#e5534b"}
          trailColor="#2a323d"
        />
      </Tooltip>

      <Space size={1} style={{ flex: "none" }}>
        {p.micOn ? (
          <AudioOutlined style={{ fontSize: 12, color: p.speaking ? "#4ade80" : "var(--app-text-dim)" }} />
        ) : (
          <AudioMutedOutlined style={{ fontSize: 12, color: "#6b7684" }} />
        )}
        <VideoCameraOutlined style={{ fontSize: 12, color: p.camOn ? "var(--app-accent)" : "#6b7684" }} />

        {canManage && !p.isSelf && (
          <Dropdown
            trigger={["click"]}
            menu={{
              onClick: ({ key }) => onAction(key, p),
              items: [
                { key: "make-host", label: "Make host", disabled: p.role === "host" },
                { key: "make-presenter", label: "Make presenter", disabled: p.role === "presenter" },
                { key: "make-participant", label: "Make participant", disabled: p.role === "participant" },
                { type: "divider" },
                { key: "mute", label: "Mute", disabled: !p.micOn },
                { key: "lower-hand", label: "Lower hand", disabled: !p.handRaised },
                { type: "divider" },
                { key: "remove", label: "Remove from meeting", danger: true },
              ],
            }}
          >
            <Button
              type="text"
              size="small"
              aria-label={`Manage ${p.name}`}
              icon={<MoreOutlined style={{ fontSize: 12 }} />}
            />
          </Dropdown>
        )}
      </Space>
    </div>
  )
}

export default function AttendeesPod({ onClose }: { onClose?: () => void }) {
  const { modal, message } = App.useApp()
  const participants = useMeetingStore((s) => s.participants)
  const setParticipantRole = useMeetingStore((s) => s.setParticipantRole)
  const muteParticipant = useMeetingStore((s) => s.muteParticipant)
  const lowerHand = useMeetingStore((s) => s.lowerHand)
  const removeParticipant = useMeetingStore((s) => s.removeParticipant)
  const muteEveryone = useMeetingStore((s) => s.muteEveryone)
  const lowerAllHands = useMeetingStore((s) => s.lowerAllHands)

  const [query, setQuery] = useState("")
  const self = participants.find((p) => p.isSelf)
  const canManage = self?.role === "host"

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? participants.filter((p) => p.name.toLowerCase().includes(q)) : participants
    const order: Role[] = ["host", "presenter", "participant"]
    return order
      .map((role) => ({
        role,
        people: filtered
          .filter((p) => p.role === role)
          .sort((a, b) => Number(b.handRaised) - Number(a.handRaised) || a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.people.length > 0)
  }, [participants, query])

  function handleAction(action: string, p: Participant) {
    switch (action) {
      case "make-host":
        setParticipantRole(p.id, "host")
        message.success(`${p.name} is now a host.`)
        break
      case "make-presenter":
        setParticipantRole(p.id, "presenter")
        message.success(`${p.name} is now a presenter.`)
        break
      case "make-participant":
        setParticipantRole(p.id, "participant")
        message.success(`${p.name} is now a participant.`)
        break
      case "mute":
        muteParticipant(p.id)
        break
      case "lower-hand":
        lowerHand(p.id)
        break
      case "remove":
        modal.confirm({
          title: `Remove ${p.name}?`,
          content: "They will be disconnected from the room and can rejoin with the meeting code.",
          okText: "Remove",
          okButtonProps: { danger: true },
          onOk: () => removeParticipant(p.id),
        })
        break
    }
  }

  const raisedCount = participants.filter((p) => p.handRaised).length

  return (
    <PodShell
      title={`Attendees ${participants.length}`}
      icon={<TeamOutlined />}
      onClose={onClose}
      extra={
        canManage ? (
          <Dropdown
            trigger={["click"]}
            menu={{
              onClick: ({ key }) => {
                if (key === "mute-all") {
                  muteEveryone()
                  message.success("Everyone muted.")
                }
                if (key === "lower-all") {
                  lowerAllHands()
                  message.success("All hands lowered.")
                }
              },
              items: [
                { key: "mute-all", label: "Mute everyone" },
                { key: "lower-all", label: "Lower all hands", disabled: raisedCount === 0 },
              ],
            }}
          >
            <Button type="text" size="small" style={{ fontSize: 11 }}>
              Manage <DownOutlined style={{ fontSize: 9 }} />
            </Button>
          </Dropdown>
        ) : undefined
      }
    >
      <Input
        size="small"
        allowClear
        prefix={<SearchOutlined style={{ color: "var(--app-text-dim)", fontSize: 12 }} />}
        placeholder="Search attendees"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ flex: "none", marginBottom: 8 }}
      />

      {raisedCount > 0 && (
        <div
          style={{
            flex: "none",
            marginBottom: 8,
            padding: "5px 8px",
            borderRadius: 5,
            background: "rgb(217 161 59 / 12%)",
            border: "1px solid rgb(217 161 59 / 30%)",
          }}
        >
          <Text style={{ fontSize: 11, color: "var(--app-warning)" }}>
            {raisedCount} {raisedCount === 1 ? "hand" : "hands"} raised
          </Text>
        </div>
      )}

      <div className="app-scroll-y" style={{ flex: 1, margin: "0 -4px" }}>
        {groups.map((g) => (
          <div key={g.role} style={{ marginBottom: 10 }}>
            <Text
              style={{
                display: "block",
                padding: "0 4px 3px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--app-text-dim)",
              }}
            >
              {ROLE_META[g.role].label}s · {g.people.length}
            </Text>
            {g.people.map((p) => (
              <Row key={p.id} p={p} canManage={!!canManage} onAction={handleAction} />
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <Text style={{ padding: 4, fontSize: 12, color: "var(--app-text-dim)" }}>No attendees match “{query}”.</Text>
        )}
      </div>
    </PodShell>
  )
}
