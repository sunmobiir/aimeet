import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Drawer } from "antd"
import RoomHeader from "@/components/RoomHeader"
import MeetingToolbar from "@/components/MeetingToolbar"
import PodRail from "@/components/PodRail"
import Splitter from "@/components/Splitter"
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
  const mediaError = useMeetingStore((s) => s.mediaError)
  const setMediaError = useMeetingStore((s) => s.setMediaError)
  const drawerPod = useMeetingStore((s) => s.drawerPod)
  const closeDrawerPod = useMeetingStore((s) => s.closeDrawerPod)

  const isMobile = useIsMobile()
  const room = rooms.find((r) => r.id === roomId)
  const splitRef = useRef<HTMLDivElement | null>(null)
  /** main-stage percentage captured when a splitter drag begins */
  const mainStart = useRef(72)

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
            <Splitter
              orientation="vertical"
              label="Resize main stage"
              onStart={() => {
                mainStart.current = mainSize
              }}
              onMove={(delta) => {
                const rect = splitRef.current?.getBoundingClientRect()
                if (!rect) return
                const pct = mainStart.current + (delta / rect.width) * 100
                setLayoutMainSize(layout.id, Math.min(82, Math.max(38, pct)))
              }}
              onKeyStep={(dir) =>
                setLayoutMainSize(layout.id, Math.min(82, Math.max(38, mainSize + dir * 2)))
              }
            />
            <PodRail layout={layout} pods={sidePods} width={`calc(${100 - mainSize}% - 6px)`} />
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
