import { Fragment, useRef } from "react"
import Splitter from "@/components/Splitter"
import { POD_META, renderPod } from "@/components/pods/registry"
import { useMeetingStore } from "@/store/useMeetingStore"
import type { Layout, PodKind } from "@/types"

/** smallest a side pod may become while dragging, in px */
const MIN_POD = 96
/** px moved per keyboard nudge */
const KEY_STEP = 24

interface PodColumnProps {
  layout: Layout
  pods: PodKind[]
  /** css width, omitted when the column is the only one in the rail */
  width?: string
}

/** A vertical stack of pods with draggable splitters between each pair. */
export default function PodColumn({ layout, pods, width }: PodColumnProps) {
  const togglePod = useMeetingStore((s) => s.togglePod)
  const setLayoutSideSizes = useMeetingStore((s) => s.setLayoutSideSizes)
  const resetLayoutSideSizes = useMeetingStore((s) => s.resetLayoutSideSizes)

  const slots = useRef(new Map<PodKind, HTMLDivElement>())
  // Pixel heights + flex weights of the two pods touching the active splitter.
  const drag = useRef<{ a: PodKind; b: PodKind; heightA: number; total: number; weight: number } | null>(null)

  const weightOf = (pod: PodKind) => layout.sideSizes?.[pod] ?? 1

  const begin = (a: PodKind, b: PodKind) => {
    const elA = slots.current.get(a)
    const elB = slots.current.get(b)
    if (!elA || !elB) return
    drag.current = {
      a,
      b,
      heightA: elA.offsetHeight,
      total: elA.offsetHeight + elB.offsetHeight,
      weight: weightOf(a) + weightOf(b),
    }
  }

  const applyDelta = (delta: number) => {
    const d = drag.current
    if (!d || d.total <= MIN_POD * 2) return
    const heightA = Math.min(d.total - MIN_POD, Math.max(MIN_POD, d.heightA + delta))
    setLayoutSideSizes(layout.id, {
      [d.a]: (heightA / d.total) * d.weight,
      [d.b]: ((d.total - heightA) / d.total) * d.weight,
    })
  }

  return (
    <div className="rail-col" style={width ? { width } : undefined}>
      {pods.map((pod, i) => (
        <Fragment key={pod}>
          {i > 0 && (
            <Splitter
              orientation="horizontal"
              label={`Resize ${POD_META[pods[i - 1]].label} and ${POD_META[pod].label} pods`}
              onStart={() => begin(pods[i - 1], pod)}
              onMove={applyDelta}
              onEnd={() => {
                drag.current = null
              }}
              onKeyStep={(dir) => applyDelta(dir * KEY_STEP)}
              onDoubleClick={() => resetLayoutSideSizes(layout.id)}
            />
          )}
          <div
            className="rail-slot"
            style={{ flexGrow: weightOf(pod) }}
            ref={(el) => {
              if (el) slots.current.set(pod, el)
              else slots.current.delete(pod)
            }}
          >
            {renderPod(pod, () => togglePod(pod))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}
