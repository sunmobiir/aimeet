import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Dropdown,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd"
import {
  ApartmentOutlined,
  CopyOutlined,
  DeleteOutlined,
  LockOutlined,
  PlusOutlined,
  SignalFilled,
  UnlockOutlined,
} from "@ant-design/icons"
import { useMeetingStore } from "@/store/useMeetingStore"
import { elapsed } from "@/lib/format"
import { ALL_PODS, POD_META } from "@/components/pods/registry"
import type { PodKind } from "@/types"

const { Text } = Typography

const CONNECTION_COLOR = {
  excellent: "#4ade80",
  good: "#f0a020",
  fair: "#e05252",
} as const

export default function RoomHeader({ onLeave }: { onLeave: () => void }) {
  const roomName = useMeetingStore((s) => s.roomName)
  const roomCode = useMeetingStore((s) => s.roomCode)
  const startedAt = useMeetingStore((s) => s.startedAt)
  const recording = useMeetingStore((s) => s.recording)
  const locked = useMeetingStore((s) => s.locked)
  const connection = useMeetingStore((s) => s.connection)
  const layouts = useMeetingStore((s) => s.layouts)
  const activeLayoutId = useMeetingStore((s) => s.activeLayoutId)
  const setActiveLayout = useMeetingStore((s) => s.setActiveLayout)
  const addLayout = useMeetingStore((s) => s.addLayout)
  const removeLayout = useMeetingStore((s) => s.removeLayout)
  const setLayoutMain = useMeetingStore((s) => s.setLayoutMain)
  const toggleLock = useMeetingStore((s) => s.toggleLock)
  const participants = useMeetingStore((s) => s.participants)
  const self = participants.find((p) => p.isSelf)

  const isHost = self?.role === "host"
  const activeLayout = layouts.find((l) => l.id === activeLayoutId)

  const [now, setNow] = useState(Date.now())
  const [layoutModal, setLayoutModal] = useState(false)
  const [layoutName, setLayoutName] = useState("")

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  function copyInvite() {
    const url = `${window.location.origin}/join/${roomCode}`
    navigator.clipboard?.writeText(url).then(
      () => message.success("Invite link copied"),
      () => message.info(url),
    )
  }

  return (
    <header className="room-header">
      <div className="room-ident">
        <span className="brand-dot" aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <div className="room-title" title={roomName}>
            {roomName}
          </div>
          <Space size={8} wrap={false}>
            <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>{elapsed(startedAt, now)}</Text>
            <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>·</Text>
            <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>
              {participants.length} in room
            </Text>
            {recording && (
              <Tag color="red" style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: "16px" }}>
                REC
              </Tag>
            )}
          </Space>
        </div>
      </div>

      <div className="room-header-center">
        <Segmented
          size="small"
          value={activeLayoutId}
          onChange={(v) => setActiveLayout(String(v))}
          options={layouts.map((l) => ({ label: l.name, value: l.id }))}
        />
        {isHost && (
          <Space size={2}>
            <Tooltip title="Choose the main stage pod">
              <Dropdown
                trigger={["click"]}
                menu={{
                  selectable: true,
                  selectedKeys: activeLayout ? [activeLayout.main] : [],
                  items: ALL_PODS.map((p) => ({
                    key: p,
                    icon: POD_META[p].icon,
                    label: POD_META[p].label,
                  })),
                  onClick: ({ key }) => {
                    if (activeLayout) setLayoutMain(activeLayout.id, key as PodKind)
                  },
                }}
              >
                <Button
                  type="text"
                  size="small"
                  aria-label="Choose main stage pod"
                  icon={<ApartmentOutlined style={{ fontSize: 12 }} />}
                />
              </Dropdown>
            </Tooltip>
            <Tooltip title="New layout">
              <Button
                type="text"
                size="small"
                aria-label="Create layout"
                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                onClick={() => {
                  setLayoutName("")
                  setLayoutModal(true)
                }}
              />
            </Tooltip>
            {layouts.length > 1 && (
              <Popconfirm
                title="Delete this layout?"
                okText="Delete"
                okButtonProps={{ danger: true, size: "small" }}
                cancelButtonProps={{ size: "small" }}
                onConfirm={() => removeLayout(activeLayoutId)}
              >
                <Tooltip title="Delete layout">
                  <Button
                    type="text"
                    size="small"
                    aria-label="Delete layout"
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )}
      </div>

      <div className="room-header-right">
        <Tooltip title={`Connection: ${connection}`}>
          <Badge
            color={CONNECTION_COLOR[connection]}
            text={
              <Text style={{ fontSize: 11, color: "var(--app-text-dim)", textTransform: "capitalize" }}>
                <SignalFilled style={{ marginInlineEnd: 4, fontSize: 10 }} />
                {connection}
              </Text>
            }
          />
        </Tooltip>

        {isHost && (
          <Tooltip title={locked ? "Room is locked — unlock to admit others" : "Lock the room"}>
            <Button
              size="small"
              type={locked ? "primary" : "default"}
              danger={locked}
              icon={locked ? <LockOutlined /> : <UnlockOutlined />}
              onClick={toggleLock}
            >
              {locked ? "Locked" : "Lock"}
            </Button>
          </Tooltip>
        )}

        <Tooltip title={`Room code ${roomCode}`}>
          <Button size="small" icon={<CopyOutlined />} onClick={copyInvite}>
            Invite
          </Button>
        </Tooltip>

        <Popconfirm
          title="Leave this meeting?"
          okText="Leave"
          okButtonProps={{ danger: true, size: "small" }}
          cancelButtonProps={{ size: "small" }}
          onConfirm={onLeave}
        >
          <Button size="small" danger type="primary">
            Leave
          </Button>
        </Popconfirm>
      </div>

      <Modal
        title="New layout"
        open={layoutModal}
        okText="Create"
        onCancel={() => setLayoutModal(false)}
        onOk={() => {
          addLayout(layoutName)
          setLayoutModal(false)
        }}
        destroyOnHidden
      >
        <Input
          placeholder="Layout name"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          onPressEnter={() => {
            addLayout(layoutName)
            setLayoutModal(false)
          }}
          autoFocus
        />
        <Text style={{ display: "block", marginTop: 8, fontSize: 12, color: "var(--app-text-dim)" }}>
          A new layout starts with the share stage plus video, attendees, and chat. Use the pod bar to add
          or remove pods.
        </Text>
      </Modal>
    </header>
  )
}
