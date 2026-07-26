import { Badge, Button, Dropdown, Space, Tooltip } from "antd"
import {
  AppstoreOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  SmileOutlined,
  StopOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import { useMeetingStore } from "@/store/useMeetingStore"
import { ALL_PODS, POD_META } from "@/components/pods/registry"
import { useIsMobile } from "@/hooks/useIsMobile"
import type { Participant, PodKind } from "@/types"

const STATUS_ITEMS: { key: NonNullable<Participant["status"]>; label: string; icon: React.ReactNode }[] = [
  { key: "agree", label: "Agree", icon: <CheckCircleOutlined /> },
  { key: "disagree", label: "Disagree", icon: <CloseCircleOutlined /> },
  { key: "speak-louder", label: "Speak louder", icon: <AudioOutlined /> },
  { key: "slower", label: "Slow down", icon: <DashboardOutlined /> },
  { key: "faster", label: "Speed up", icon: <DashboardOutlined /> },
  { key: "stepped-away", label: "Stepped away", icon: <CoffeeOutlined /> },
]

export default function MeetingToolbar() {
  const micOn = useMeetingStore((s) => s.micOn)
  const camOn = useMeetingStore((s) => s.camOn)
  const cameraStream = useMeetingStore((s) => s.cameraStream)
  const toggleMic = useMeetingStore((s) => s.toggleMic)
  const setCameraStream = useMeetingStore((s) => s.setCameraStream)
  const setMediaError = useMeetingStore((s) => s.setMediaError)
  const recording = useMeetingStore((s) => s.recording)
  const toggleRecording = useMeetingStore((s) => s.toggleRecording)
  const raiseHand = useMeetingStore((s) => s.raiseHand)
  const setSelfStatus = useMeetingStore((s) => s.setSelfStatus)
  const togglePod = useMeetingStore((s) => s.togglePod)
  const layouts = useMeetingStore((s) => s.layouts)
  const activeLayoutId = useMeetingStore((s) => s.activeLayoutId)
  const closedPods = useMeetingStore((s) => s.closedPods)
  const unreadChat = useMeetingStore((s) => s.unreadChat)
  const participants = useMeetingStore((s) => s.participants)
  const drawerPod = useMeetingStore((s) => s.drawerPod)
  const openDrawerPod = useMeetingStore((s) => s.openDrawerPod)

  const isMobile = useIsMobile()
  const self = participants.find((p) => p.isSelf)
  const isHost = self?.role === "host"
  const layout = layouts.find((l) => l.id === activeLayoutId)

  function podOpen(pod: (typeof ALL_PODS)[number]) {
    if (!layout) return false
    const inLayout = layout.main === pod || layout.side.includes(pod)
    if (!inLayout) return false
    return !(closedPods[layout.id] ?? []).includes(pod)
  }

  async function handleCamera() {
    if (camOn || cameraStream) {
      cameraStream?.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Respect the current mic state on a freshly acquired stream.
      stream.getAudioTracks().forEach((t) => {
        t.enabled = micOn
      })
      setCameraStream(stream)
      setMediaError(null)
    } catch {
      setMediaError("Camera access was denied. Your tile will show your initials instead.")
    }
  }

  const statusMenu = {
    selectable: true,
    selectedKeys: self?.status ? [self.status] : [],
    items: STATUS_ITEMS.map((s) => ({ key: s.key, label: s.label, icon: s.icon })),
    onClick: ({ key }: { key: string }) => setSelfStatus(key as NonNullable<Participant["status"]>),
  }

  // On narrow screens every pod is reachable from one dropdown and opens in a drawer.
  const podMenu = {
    selectable: true,
    selectedKeys: drawerPod ? [drawerPod] : [],
    items: ALL_PODS.map((pod) => {
      const isStage = layout?.main === pod
      return {
        key: pod,
        icon: POD_META[pod].icon,
        disabled: isStage,
        label: (
          <span className="pod-menu-item">
            {POD_META[pod].label}
            {isStage && <span className="muted"> · on stage</span>}
            {pod === "chat" && unreadChat > 0 && !isStage && (
              <Badge count={unreadChat} size="small" style={{ marginInlineStart: 8 }} />
            )}
          </span>
        ),
      }
    }),
    onClick: ({ key }: { key: string }) => openDrawerPod(key as PodKind),
  }

  if (isMobile) {
    return (
      <footer className="toolbar toolbar--compact" aria-label="Meeting controls">
        <Space size={4}>
          <Tooltip title={micOn ? "Mute microphone" : "Unmute microphone"}>
            <Button
              shape="circle"
              type={micOn ? "primary" : "default"}
              danger={!micOn}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              icon={micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={toggleMic}
            />
          </Tooltip>

          <Tooltip title={camOn ? "Turn camera off" : "Turn camera on"}>
            <Button
              shape="circle"
              type={camOn ? "primary" : "default"}
              aria-label={camOn ? "Turn camera off" : "Turn camera on"}
              icon={camOn ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
              onClick={handleCamera}
            />
          </Tooltip>

          <Tooltip title={self?.handRaised ? "Lower your hand" : "Raise your hand"}>
            <Button
              shape="round"
              size="small"
              type={self?.handRaised ? "primary" : "default"}
              onClick={raiseHand}
              aria-pressed={!!self?.handRaised}
            >
              Hand
            </Button>
          </Tooltip>

          <Dropdown trigger={["click"]} placement="topLeft" menu={statusMenu}>
            <Tooltip title="Send a status to the room">
              <Button shape="circle" aria-label="Send a status" icon={<SmileOutlined />} />
            </Tooltip>
          </Dropdown>
        </Space>

        <Dropdown trigger={["click"]} placement="top" menu={podMenu}>
          <Badge count={unreadChat} size="small" offset={[-6, 2]}>
            <Button shape="round" type="primary" ghost icon={<AppstoreOutlined />}>
              Pods
            </Button>
          </Badge>
        </Dropdown>

        {isHost && (
          <Tooltip title={recording ? "Stop recording" : "Start recording"}>
            <Button
              shape="circle"
              danger={recording}
              type={recording ? "primary" : "default"}
              aria-label={recording ? "Stop recording" : "Start recording"}
              icon={recording ? <StopOutlined /> : <span className="rec-dot" aria-hidden="true" />}
              onClick={toggleRecording}
            />
          </Tooltip>
        )}
      </footer>
    )
  }

  return (
    <footer className="toolbar" aria-label="Meeting controls">
      <Space size={6}>
        <Tooltip title={micOn ? "Mute microphone" : "Unmute microphone"}>
          <Button
            shape="round"
            type={micOn ? "primary" : "default"}
            danger={!micOn}
            icon={micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
            onClick={toggleMic}
          >
            {micOn ? "Mic on" : "Muted"}
          </Button>
        </Tooltip>

        <Tooltip title={camOn ? "Turn camera off" : "Turn camera on"}>
          <Button
            shape="round"
            type={camOn ? "primary" : "default"}
            icon={camOn ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
            onClick={handleCamera}
          >
            {camOn ? "Camera on" : "Camera"}
          </Button>
        </Tooltip>

        <Tooltip title={self?.handRaised ? "Lower your hand" : "Raise your hand"}>
          <Button
            shape="round"
            type={self?.handRaised ? "primary" : "default"}
            onClick={raiseHand}
            aria-pressed={!!self?.handRaised}
          >
            {self?.handRaised ? "Hand raised" : "Raise hand"}
          </Button>
        </Tooltip>

        <Dropdown trigger={["click"]} menu={statusMenu}>
          <Tooltip title="Send a status to the room">
            <Button shape="round" icon={<SmileOutlined />}>
              Status
            </Button>
          </Tooltip>
        </Dropdown>
      </Space>

      <div className="toolbar-pods" role="group" aria-label="Toggle pods">
        {ALL_PODS.map((pod) => {
          const open = podOpen(pod)
          const button = (
            <Button
              key={pod}
              size="small"
              type={open ? "primary" : "text"}
              icon={POD_META[pod].icon}
              onClick={() => togglePod(pod)}
              aria-pressed={open}
              disabled={layout?.main === pod}
            >
              {POD_META[pod].label}
            </Button>
          )
          return pod === "chat" && unreadChat > 0 && !open ? (
            <Badge key={pod} count={unreadChat} size="small" offset={[-4, 2]}>
              {button}
            </Badge>
          ) : (
            button
          )
        })}
      </div>

      <Space size={6}>
        {isHost && (
          <Tooltip title={recording ? "Stop recording" : "Start recording this session"}>
            <Button
              shape="round"
              danger={recording}
              type={recording ? "primary" : "default"}
              icon={recording ? <StopOutlined /> : <span className="rec-dot" aria-hidden="true" />}
              onClick={toggleRecording}
            >
              {recording ? "Stop" : "Record"}
            </Button>
          </Tooltip>
        )}
      </Space>
    </footer>
  )
}
