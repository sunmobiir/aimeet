import { useEffect, useState } from "react"

/** From this width up there is room to split the pod rail into two columns. */
export const WIDE_BREAKPOINT = 1500

function query(width: number) {
  return `(min-width: ${width}px)`
}

/** Tracks a min-width media query so layout decisions stay in sync with CSS. */
export function useIsWideScreen(width: number = WIDE_BREAKPOINT) {
  const [isWide, setIsWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query(width)).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query(width))
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches)
    setIsWide(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [width])

  return isWide
}
