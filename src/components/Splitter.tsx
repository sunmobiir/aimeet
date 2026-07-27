import { useEffect, useRef, useState } from "react"

interface SplitterProps {
  /** "vertical" = vertical bar that resizes left/right, "horizontal" = bar that resizes up/down */
  orientation: "vertical" | "horizontal"
  label: string
  /** fired on pointer down / before a keyboard step, so callers can snapshot sizes */
  onStart?: () => void
  /** pixel delta from the drag origin along the resize axis */
  onMove: (delta: number) => void
  onEnd?: () => void
  /** keyboard nudge, -1 = shrink the leading pane, 1 = grow it */
  onKeyStep?: (dir: -1 | 1) => void
  onDoubleClick?: () => void
}

export default function Splitter({
  orientation,
  label,
  onStart,
  onMove,
  onEnd,
  onKeyStep,
  onDoubleClick,
}: SplitterProps) {
  const vertical = orientation === "vertical"
  const [dragging, setDragging] = useState(false)
  const origin = useRef(0)

  // Keep the latest callbacks in a ref so the drag listeners never re-bind mid-drag.
  const handlers = useRef({ onMove, onEnd })
  handlers.current = { onMove, onEnd }

  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) =>
      handlers.current.onMove((vertical ? e.clientX : e.clientY) - origin.current)
    const up = () => setDragging(false)

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    document.body.style.cursor = vertical ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"

    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      handlers.current.onEnd?.()
    }
  }, [dragging, vertical])

  const classes = ["splitter", vertical ? "splitter--vertical" : "splitter--horizontal"]
  if (dragging) classes.push("splitter--active")

  return (
    <div
      className={classes.join(" ")}
      role="separator"
      aria-label={label}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      tabIndex={0}
      onDoubleClick={onDoubleClick}
      onPointerDown={(e) => {
        e.preventDefault()
        origin.current = vertical ? e.clientX : e.clientY
        onStart?.()
        setDragging(true)
      }}
      onKeyDown={(e) => {
        if (!onKeyStep) return
        const down = vertical ? "ArrowRight" : "ArrowDown"
        const up = vertical ? "ArrowLeft" : "ArrowUp"
        if (e.key !== down && e.key !== up) return
        e.preventDefault()
        onStart?.()
        onKeyStep(e.key === up ? -1 : 1)
      }}
    >
      <span className="splitter-grip" aria-hidden="true" />
    </div>
  )
}
