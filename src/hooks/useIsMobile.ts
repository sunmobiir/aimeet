import { useEffect, useState } from "react"

/** Anything narrower than this gets the drawer-based single-column meeting UI. */
export const MOBILE_BREAKPOINT = 900

function query(width: number) {
  return `(max-width: ${width - 1}px)`
}

/** Tracks a max-width media query so layout decisions stay in sync with CSS. */
export function useIsMobile(width: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query(width)).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query(width))
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [width])

  return isMobile
}
