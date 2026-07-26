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
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  MoreOutlined,
  PlusOutlined,
  SignalFilled,
  UnlockOutlined,
} from "@ant-design/icons"
import { useMeetingStore } from "@/store/useMeetingStore"
import { elapsed } from "@/lib/format"
import { ALL_PODS, POD_META } from "@/components/pods/registry"
import { useIsMobile } from "@/hooks/useIsMobile"
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
  const isMobile = useIsMobile()

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

  function confirmLeave() {
    Modal.confirm({
      title: "Leave this meeting?",
      okText: "Leave",
      okButtonProps: { danger: true },
      onOk: onLeave,
    })
  }

  // Narrow screens fold the host controls into a single overflow menu.
  const moreItems: NonNullable<React.ComponentProps<typeof Dropdown>["menu"]>["items"] = [
    { key: "invite", icon: <CopyOutlined />, label: `Copy invite · ${roomCode}` },
    ...(isHost
      ? [
          {
            key: "lock",
            icon: locked ? <LockOutlined /> : <UnlockOutlined />,
            label: locked ? "Unlock room" : "Lock room",
          },
          { type: "divider" as const },
          {
            key: "stage",
            icon: <ApartmentOutlined />,
            label: "Main stage pod",
            children: ALL_PODS.map((p) => ({
              key: `stage:${p}`,
              icon: POD_META[p].icon,
              label: POD_META[p].label,
              disabled: activeLayout?.main === p,
            })),
          },
          { key: "new-layout", icon: <PlusOutlined />, label: "New layout" },
          ...(layouts.length > 1
            ? [{ key: "del-layout", icon: <DeleteOutlined />, label: "Delete layout", danger: true }]
            : []),
        ]
      : []),
  ]

  function onMoreClick({ key }: { key: string }) {
    if (key === "invite") return copyInvite()
    if (key === "lock") return toggleLock()
    if (key === "new-layout") {
      setLayoutName("")
      setLayoutModal(true)
      return
    }
    if (key === "del-layout") return removeLayout(activeLayoutId)
    if (key.startsWith("stage:") && activeLayout) {
      setLayoutMain(activeLayout.id, key.slice("stage:".length) as PodKind)
    }
  }

  return (
    <header className={isMobile ? "room-header room-header--compact" : "room-header"}>
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
        {isMobile ? (
          <Dropdown
            trigger={["click"]}
            menu={{
              selectable: true,
              selectedKeys: [activeLayoutId],
              items: layouts.map((l) => ({ key: l.id, label: l.name })),
              onClick: ({ key }) => setActiveLayout(key),
            }}
          >
            <Button size="small" aria-label="Switch layout">
              <Space size={6}>
                <span className="truncate" style={{ maxWidth: 110 }}>
                  {activeLayout?.name ?? "Layout"}
                </span>
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="room-header-right">
        <Tooltip title={`Connection: ${connection}`}>
          <Badge
            color={CONNECTION_COLOR[connection]}
            text={
              isMobile ? null : (
                <Text style={{ fontSize: 11, color: "var(--app-text-dim)", textTransform: "capitalize" }}>
                  <SignalFilled style={{ marginInlineEnd: 4, fontSize: 10 }} />
                  {connection}
                </Text>
              )
            }
          />
        </Tooltip>

        {isMobile && (
          <>
            <Dropdown trigger={["click"]} placement="bottomRight" menu={{ items: moreItems, onClick: onMoreClick }}>
              <Button size="small" aria-label="More meeting options" icon={<MoreOutlined />} />
            </Dropdown>
            <Button
              size="small"
              danger
              type="primary"
              aria-label="Leave meeting"
              icon={<LogoutOutlined />}
              onClick={confirmLeave}
            />
          </>
        )}

        {!isMobile && isHost && (
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

        {!isMobile && (
          <>
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
          </>
        )}
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
