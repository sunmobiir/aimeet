import { useCallback, useEffect, useRef, useState } from "react"
import { Button, ColorPicker, Segmented, Slider, Space, Tooltip } from "antd"
import {
  ClearOutlined,
  EditOutlined,
  HighlightOutlined,
  UndoOutlined,
} from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { SELF_ID, useMeetingStore } from "@/store/useMeetingStore"
import type { Stroke } from "@/types"

type Tool = "pen" | "highlighter" | "eraser"

/** Logical drawing surface. All points are stored in this space so the board
 *  scales correctly when the pod is resized. */
const BOARD_W = 1600
const BOARD_H = 900

export default function WhiteboardPod({ onClose }: { onClose?: () => void }) {
  const strokes = useMeetingStore((s) => s.strokes)
  const addStroke = useMeetingStore((s) => s.addStroke)
  const undoStroke = useMeetingStore((s) => s.undoStroke)
  const clearStrokes = useMeetingStore((s) => s.clearStrokes)
  const selfRole = useMeetingStore((s) => s.participants.find((p) => p.isSelf)?.role)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const draftRef = useRef<Stroke | null>(null)

  const [tool, setTool] = useState<Tool>("pen")
  const [color, setColor] = useState("#e8ecef")
  const [width, setWidth] = useState(4)

  const canEdit = selfRole !== "participant"

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = Math.max(1, rect.width * dpr)
      canvas.height = Math.max(1, rect.height * dpr)
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Map logical board space onto the physical canvas.
    const sx = canvas.width / BOARD_W
    const sy = canvas.height / BOARD_H
    ctx.setTransform(sx, 0, 0, sy, 0, 0)

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.045)"
    ctx.lineWidth = 1 / Math.min(sx, sy)
    for (let x = 0; x <= BOARD_W; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, BOARD_H)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_H; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(BOARD_W, y)
      ctx.stroke()
    }

    const all = draftRef.current ? [...strokes, draftRef.current] : strokes
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (const stroke of all) {
      if (stroke.points.length < 2) continue
      ctx.globalAlpha = stroke.tool === "highlighter" ? 0.32 : 1
      ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over"
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
  }, [strokes])

  useEffect(() => {
    paint()
  }, [paint])

  // Repaint on pod resize.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => paint())
    ro.observe(el)
    return () => ro.disconnect()
  }, [paint])

  function toBoard(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * BOARD_W,
      y: ((e.clientY - rect.top) / rect.height) * BOARD_H,
    }
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canEdit) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draftRef.current = {
      id: crypto.randomUUID(),
      authorId: SELF_ID,
      color,
      // scale line width into board space so it looks right at any pod size
      width: tool === "highlighter" ? width * 4 : tool === "eraser" ? width * 5 : width * 1.6,
      tool,
      points: [toBoard(e)],
    }
    paint()
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!draftRef.current) return
    draftRef.current.points.push(toBoard(e))
    paint()
  }

  function handleUp() {
    const draft = draftRef.current
    draftRef.current = null
    if (draft && draft.points.length > 1) addStroke(draft)
    else paint()
  }

  return (
    <PodShell
      title="Whiteboard"
      icon={<EditOutlined />}
      onClose={onClose}
      flush
      extra={
        canEdit ? (
          <Space size={2}>
            <Tooltip title="Undo my last stroke">
              <Button
                type="text"
                size="small"
                aria-label="Undo last stroke"
                icon={<UndoOutlined style={{ fontSize: 12 }} />}
                onClick={undoStroke}
                disabled={!strokes.some((s) => s.authorId === SELF_ID)}
              />
            </Tooltip>
            <Tooltip title="Clear board">
              <Button
                type="text"
                size="small"
                aria-label="Clear whiteboard"
                icon={<ClearOutlined style={{ fontSize: 12 }} />}
                onClick={clearStrokes}
                disabled={!strokes.length}
              />
            </Tooltip>
          </Space>
        ) : null
      }
      footer={
        canEdit ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Segmented<Tool>
              size="small"
              value={tool}
              onChange={setTool}
              options={[
                { value: "pen", icon: <EditOutlined />, title: "Pen" },
                { value: "highlighter", icon: <HighlightOutlined />, title: "Highlighter" },
                { value: "eraser", icon: <ClearOutlined />, title: "Eraser" },
              ]}
            />
            <ColorPicker
              size="small"
              value={color}
              disabled={tool === "eraser"}
              onChange={(c) => setColor(c.toHexString())}
              presets={[
                {
                  label: "Board",
                  colors: ["#e8ecef", "#17a2a2", "#f0a020", "#e05252", "#4a9de0", "#7fbf5f"],
                },
              ]}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120, flex: 1 }}>
              <span className="muted" style={{ fontSize: 11 }}>
                Size
              </span>
              <Slider
                min={1}
                max={12}
                value={width}
                onChange={setWidth}
                style={{ flex: 1, margin: 0 }}
                aria-label="Brush size"
              />
            </div>
          </div>
        ) : (
          <span className="muted" style={{ fontSize: 11 }}>
            Only hosts and presenters can draw on the whiteboard.
          </span>
        )
      }
    >
      <div ref={wrapRef} className="wb-wrap">
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          style={{ cursor: canEdit ? "crosshair" : "default" }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        />
      </div>
    </PodShell>
  )
}
