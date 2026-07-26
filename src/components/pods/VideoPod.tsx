import { useEffect, useRef } from "react"
import { Avatar, Badge, Segmented, Tooltip, Typography } from "antd"
import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  PushpinOutlined,
} from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { initials } from "@/lib/format"
import type { Participant } from "@/types"
import { useState } from "react"

const { Text } = Typography

function SelfTile({ participant, stream }: { participant: Participant; stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (stream) {
      el.srcObject = stream
      el.play().catch(() => {
        /* autoplay can be blocked; the muted attribute usually prevents this */
      })
    } else {
      el.srcObject = null
    }
  }, [stream])

  return (
    <div className={`tile${participant.speaking ? " tile--speaking" : ""}`}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview" />
      ) : (
        <Avatar size={44} style={{ background: participant.color, color: "#03211f", fontWeight: 700 }}>
          {initials(participant.name)}
        </Avatar>
      )}
      <div className="tile-label">
        {participant.micOn ? (
          <AudioOutlined style={{ color: participant.speaking ? "#4ade80" : undefined, fontSize: 11 }} />
        ) : (
          <AudioMutedOutlined style={{ color: "#f87171", fontSize: 11 }} />
        )}
        <span className="tile-name">{participant.name} (you)</span>
      </div>
    </div>
  )
}

function RemoteTile({ participant }: { participant: Participant }) {
  return (
    <div className={`tile${participant.speaking ? " tile--speaking" : ""}`}>
      {participant.camOn ? (
        // No signalling server exists in a client-only build, so remote video
        // is represented by a stable identity tile rather than a fake stream.
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            background: `linear-gradient(150deg, ${participant.color}2e, #0a0e13 72%)`,
          }}
        >
          <Avatar size={40} style={{ background: participant.color, color: "#03211f", fontWeight: 700 }}>
            {initials(participant.name)}
          </Avatar>
        </div>
      ) : (
        <Avatar size={40} style={{ background: "#232b35", color: "var(--app-text-dim)", fontWeight: 700 }}>
          {initials(participant.name)}
        </Avatar>
      )}
      <div className="tile-label">
        {participant.micOn ? (
          <AudioOutlined style={{ color: participant.speaking ? "#4ade80" : undefined, fontSize: 11 }} />
        ) : (
          <AudioMutedOutlined style={{ color: "#f87171", fontSize: 11 }} />
        )}
        <span className="tile-name">{participant.name}</span>
        {participant.handRaised && <span aria-label="Hand raised">✋</span>}
      </div>
    </div>
  )
}

export default function VideoPod({ onClose }: { onClose?: () => void }) {
  const participants = useMeetingStore((s) => s.participants)
  const cameraStream = useMeetingStore((s) => s.cameraStream)
  const [filter, setFilter] = useState<"active" | "all">("active")

  const self = participants.find((p) => p.isSelf)
  const others = participants.filter((p) => !p.isSelf)

  // "Active" shows people who are actually contributing video/audio.
  const visibleOthers = filter === "all" ? others : others.filter((p) => p.camOn || p.micOn || p.handRaised)

  return (
    <PodShell
      title="Video"
      icon={<VideoCameraOutlined />}
      onClose={onClose}
      extra={
        <Segmented
          size="small"
          value={filter}
          onChange={(v) => setFilter(v as "active" | "all")}
          options={[
            { label: "Active", value: "active" },
            { label: `All ${others.length + 1}`, value: "all" },
          ]}
        />
      }
    >
      <div className="app-scroll-y" style={{ flex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
            gap: 8,
          }}
        >
          {self && <SelfTile participant={self} stream={cameraStream} />}
          {visibleOthers.map((p) => (
            <RemoteTile key={p.id} participant={p} />
          ))}
        </div>

        {visibleOthers.length === 0 && (
          <Text style={{ display: "block", marginTop: 12, fontSize: 12, color: "var(--app-text-dim)" }}>
            No one else has their camera or mic on yet.
          </Text>
        )}
      </div>

      <div style={{ flex: "none", paddingTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
        <Tooltip title="Attendees currently speaking">
          <Badge
            color="#4ade80"
            text={
              <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>
                {participants.filter((p) => p.speaking).length} speaking
              </Text>
            }
          />
        </Tooltip>
        <Tooltip title="Cameras on">
          <Badge
            color="#17a2a2"
            text={
              <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>
                {participants.filter((p) => p.camOn).length} on camera
              </Text>
            }
          />
        </Tooltip>
        <span style={{ flex: 1 }} />
        <Tooltip title="In a full deployment this pod pins the active speaker via WebRTC.">
          <PushpinOutlined style={{ fontSize: 11, color: "var(--app-text-dim)" }} />
        </Tooltip>
      </div>
    </PodShell>
  )
}
