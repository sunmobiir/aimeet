import { useEffect, useRef } from "react"
import { Button, Empty, Space, Tag, Tooltip } from "antd"
import {
  DesktopOutlined,
  LeftOutlined,
  RightOutlined,
  StopOutlined,
} from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"

export default function SharePod({ onClose }: { onClose?: () => void }) {
  const screenSharing = useMeetingStore((s) => s.screenSharing)
  const screenStream = useMeetingStore((s) => s.screenStream)
  const setScreenStream = useMeetingStore((s) => s.setScreenStream)
  const setScreenSharing = useMeetingStore((s) => s.setScreenSharing)
  const setMediaError = useMeetingStore((s) => s.setMediaError)
  const slide = useMeetingStore((s) => s.slide)
  const slideCount = useMeetingStore((s) => s.slideCount)
  const setSlide = useMeetingStore((s) => s.setSlide)
  const roomName = useMeetingStore((s) => s.roomName)
  const selfRole = useMeetingStore((s) => s.participants.find((p) => p.isSelf)?.role)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canPresent = selfRole !== "participant"

  useEffect(() => {
    const el = videoRef.current
    if (el && screenStream) el.srcObject = screenStream
  }, [screenStream])

  // If the user stops sharing from the browser's own UI, sync our state back.
  useEffect(() => {
    if (!screenStream) return
    const track = screenStream.getVideoTracks()[0]
    if (!track) return
    const onEnded = () => {
      setScreenSharing(false)
      setScreenStream(null)
    }
    track.addEventListener("ended", onEnded)
    return () => track.removeEventListener("ended", onEnded)
  }, [screenStream, setScreenSharing, setScreenStream])

  async function startShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      setScreenStream(stream)
      setScreenSharing(true)
      setMediaError(null)
    } catch {
      setMediaError("Screen sharing was blocked or cancelled. The slide deck is shown instead.")
    }
  }

  function stopShare() {
    screenStream?.getTracks().forEach((t) => t.stop())
    setScreenStream(null)
    setScreenSharing(false)
  }

  return (
    <PodShell
      title={screenSharing ? "Screen share" : "Presentation"}
      icon={<DesktopOutlined />}
      onClose={onClose}
      flush
      extra={
        <Space size={4}>
          {screenSharing ? (
            <Tag color="red" style={{ marginInlineEnd: 0, fontSize: 10 }}>
              LIVE
            </Tag>
          ) : (
            <span className="muted" style={{ fontSize: 11 }}>
              {slide} / {slideCount}
            </span>
          )}
          {canPresent &&
            (screenSharing ? (
              <Tooltip title="Stop sharing">
                <Button
                  type="text"
                  size="small"
                  danger
                  aria-label="Stop screen share"
                  icon={<StopOutlined style={{ fontSize: 12 }} />}
                  onClick={stopShare}
                />
              </Tooltip>
            ) : (
              <Button size="small" icon={<DesktopOutlined />} onClick={startShare}>
                Share screen
              </Button>
            ))}
        </Space>
      }
      footer={
        !screenSharing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              size="small"
              icon={<LeftOutlined />}
              disabled={slide <= 1 || !canPresent}
              onClick={() => setSlide(slide - 1)}
              aria-label="Previous slide"
            />
            <Button
              size="small"
              icon={<RightOutlined />}
              disabled={slide >= slideCount || !canPresent}
              onClick={() => setSlide(slide + 1)}
              aria-label="Next slide"
            />
            <div className="slide-dots" role="presentation">
              {Array.from({ length: slideCount }, (_, i) => (
                <span key={i} className={i + 1 === slide ? "slide-dot on" : "slide-dot"} />
              ))}
            </div>
            <span className="muted" style={{ fontSize: 11, marginInlineStart: "auto" }}>
              {canPresent ? "You control the deck" : "The presenter controls the deck"}
            </span>
          </div>
        ) : null
      }
    >
      <div className="stage">
        {screenSharing && screenStream ? (
          <video ref={videoRef} className="stage-video" autoPlay playsInline muted />
        ) : (
          <div className="slide" aria-live="polite">
            <div className="slide-kicker">{roomName || "Session"}</div>
            <h2 className="slide-title">{SLIDES[(slide - 1) % SLIDES.length].title}</h2>
            <ul className="slide-bullets">
              {SLIDES[(slide - 1) % SLIDES.length].bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="slide-foot">
              <span>Slide {slide}</span>
              <span>{SLIDES[(slide - 1) % SLIDES.length].tag}</span>
            </div>
          </div>
        )}
        {!screenSharing && !SLIDES.length && <Empty description="Nothing is being shared" />}
      </div>
    </PodShell>
  )
}

const SLIDES = [
  {
    title: "Quarterly Business Review",
    tag: "Overview",
    bullets: ["Agenda and objectives", "Where we finished last quarter", "What we are asking of this room"],
  },
  {
    title: "Where We Are Today",
    tag: "Context",
    bullets: ["Adoption grew across all three regions", "Support load flattened despite growth", "Two initiatives slipped a milestone"],
  },
  {
    title: "What Changed",
    tag: "Analysis",
    bullets: ["Onboarding rebuilt around a single guided path", "Pricing experiment concluded", "Reliability work paid down most of the backlog"],
  },
  {
    title: "Customer Signal",
    tag: "Research",
    bullets: ["Interviews with 34 accounts", "Recurring theme: reporting depth", "Churn risk concentrated in one segment"],
  },
  {
    title: "The Plan",
    tag: "Proposal",
    bullets: ["Consolidate the reporting surface", "Ship the shared workspace model", "Hold headcount flat through the quarter"],
  },
  {
    title: "Open Questions",
    tag: "Discussion",
    bullets: ["Do we sequence reporting before workspaces?", "What do we cut to protect the date?", "Who owns the migration story?"],
  },
]
