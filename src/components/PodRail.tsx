import { useRef } from "react"
import PodColumn from "@/components/PodColumn"
import Splitter from "@/components/Splitter"
import { useMeetingStore } from "@/store/useMeetingStore"
import type { Layout, PodKind } from "@/types"

/** Above this many open side pods a wide screen splits the rail into two columns. */
export const TWO_COLUMN_MIN_PODS = 4

interface PodRailProps {
  layout: Layout
  pods: PodKind[]
  width: string
  /** true when the viewport is wide enough for a second rail column */
  twoColumn: boolean
}

export default function PodRail({ layout, pods, width, twoColumn }: PodRailProps) {
  const setLayoutSideColumnSize = useMeetingStore((s) => s.setLayoutSideColumnSize)

  const railRef = useRef<HTMLDivElement | null>(null)
  /** first-column percentage captured when the column splitter drag begins */
  const colStart = useRef(50)

  const colSize = layout.sideColumnSize ?? 50

  if (!twoColumn) {
    return (
      <div className="rail" style={{ width }} ref={railRef}>
        <PodColumn layout={layout} pods={pods} />
      </div>
    )
  }

  // Fill the left column first so an odd pod count leaves the extra pod on the left.
  const split = Math.ceil(pods.length / 2)

  return (
    <div className="rail rail--two-col" style={{ width }} ref={railRef}>
      <PodColumn layout={layout} pods={pods.slice(0, split)} width={`calc(${colSize}% - 6px)`} />
      <Splitter
        orientation="vertical"
        label="Resize pod columns"
        onStart={() => {
          colStart.current = colSize
        }}
        onMove={(delta) => {
          const rect = railRef.current?.getBoundingClientRect()
          if (!rect) return
          setLayoutSideColumnSize(layout.id, colStart.current + (delta / rect.width) * 100)
        }}
        onKeyStep={(dir) => setLayoutSideColumnSize(layout.id, colSize + dir * 2)}
        onDoubleClick={() => setLayoutSideColumnSize(layout.id, 50)}
      />
      <PodColumn layout={layout} pods={pods.slice(split)} width={`calc(${100 - colSize}% - 6px)`} />
    </div>
  )
}
