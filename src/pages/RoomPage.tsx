import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert } from "antd"
import RoomHeader from "@/components/RoomHeader"
import MeetingToolbar from "@/components/MeetingToolbar"
import { renderPod } from "@/components/pods/registry"
import { useMeetingStore } from "@/store/useMeetingStore"
import { useSessionStore } from "@/store/useSessionStore"
import { startSimulation } from "@/lib/simulation"

export default function RoomPage() {
  const { roomId = "" } = useParams()
  const navigate = useNavigate()

  const rooms = useSessionStore((s) => s.rooms)
  const displayName = useSessionStore((s) => s.displayName)
  const role = useSessionStore((s) => s.role)

  const initRoom = useMeetingStore((s) => s.initRoom)
  const teardown = useMeetingStore((s) => s.teardown)
  const activeRoomId = useMeetingStore((s) => s.roomId)
  const layouts = useMeetingStore((s) => s.layouts)
  const activeLayoutId = useMeetingStore((s) => s.activeLayoutId)
  const closedPods = useMeetingStore((s) => s.closedPods)
  const setLayoutMainSize = useMeetingStore((s) => s.setLayoutMainSize)
  const togglePod = useMeetingStore((s) => s.togglePod)
  const mediaError = useMeetingStore((s) => s.mediaError)
  const setMediaError = useMeetingStore((s) => s.setMediaError)

  const room = rooms.find((r) => r.id === roomId)
  const splitRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)

  // Enter the room once per roomId.
  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true })
      return
    }
    initRoom({
      roomId: room.id,
      roomName: room.name,
      roomCode: room.code,
      displayName: displayName || "You",
      role,
      template: room.template,
    })
    return () => teardown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // Drive fake remote presence while we are inside a room.
  useEffect(() => {
    if (!activeRoomId) return
    return startSimulation()
  }, [activeRoomId])

  const layout = layouts.find((l) => l.id === activeLayoutId)
  const closed = layout ? (closedPods[layout.id] ?? []) : []
  const sidePods = layout ? layout.side.filter((p) => !closed.includes(p)) : []
  const hasSide = sidePods.length > 0
  const mainSize = hasSide ? (layout?.mainSize ?? 72) : 100

  const onDragMove = useCallback(
    (clientX: number) => {
      const el = splitRef.current
      if (!el || !layout) return
      const rect = el.getBoundingClientRect()
      const pct = ((clientX - rect.left) / rect.width) * 100
      setLayoutMainSize(layout.id, Math.min(82, Math.max(38, pct)))
    },
    [layout, setLayoutMainSize],
  )

  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => onDragMove(e.clientX)
    const up = () => setDragging(false)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragging, onDragMove])

  if (!room || !activeRoomId || !layout) return null

  return (
    <div className="room">
      <RoomHeader
        onLeave={() => {
          teardown()
          navigate("/")
        }}
      />

      {mediaError && (
        <Alert
          type="warning"
          showIcon
          closable
          banner
          message={mediaError}
          onClose={() => setMediaError(null)}
        />
      )}

      <div className="room-body" ref={splitRef}>
        <div className="stage-col" style={{ width: `${mainSize}%` }}>
          {renderPod(layout.main)}
        </div>

        {hasSide && (
          <>
            <div
              className={dragging ? "splitter splitter--active" : "splitter"}
              role="separator"
              aria-label="Resize main stage"
              aria-orientation="vertical"
              tabIndex={0}
              onPointerDown={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setLayoutMainSize(layout.id, Math.max(38, mainSize - 2))
                if (e.key === "ArrowRight") setLayoutMainSize(layout.id, Math.min(82, mainSize + 2))
              }}
            />
            <div className="rail" style={{ width: `calc(${100 - mainSize}% - 6px)` }}>
              {sidePods.map((pod) => (
                <div key={pod} className="rail-slot">
                  {renderPod(pod, () => togglePod(pod))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <MeetingToolbar />
    </div>
  )
}
