import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Drawer } from "antd"
import RoomHeader from "@/components/RoomHeader"
import MeetingToolbar from "@/components/MeetingToolbar"
import { POD_META, renderPod } from "@/components/pods/registry"
import { useIsMobile } from "@/hooks/useIsMobile"
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
  const drawerPod = useMeetingStore((s) => s.drawerPod)
  const closeDrawerPod = useMeetingStore((s) => s.closeDrawerPod)

  const isMobile = useIsMobile()
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

  // Leaving the narrow layout hands the pods back to the side rail.
  useEffect(() => {
    if (!isMobile && drawerPod) closeDrawerPod()
  }, [isMobile, drawerPod, closeDrawerPod])

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

      <div className={isMobile ? "room-body room-body--compact" : "room-body"} ref={splitRef}>
        <div className="stage-col" style={{ width: isMobile ? "100%" : `${mainSize}%` }}>
          {renderPod(layout.main)}
        </div>

        {!isMobile && hasSide && (
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

      <Drawer
        placement="bottom"
        height="78%"
        open={isMobile && !!drawerPod}
        onClose={closeDrawerPod}
        closable={false}
        className="pod-drawer"
        title={null}
        styles={{ header: { display: "none" }, body: { padding: 0, display: "flex" } }}
        aria-label={drawerPod ? `${POD_META[drawerPod].label} pod` : undefined}
        destroyOnHidden
      >
        {drawerPod && renderPod(drawerPod, closeDrawerPod)}
      </Drawer>
    </div>
  )
}
