import { useMeetingStore } from "@/store/useMeetingStore"
import { CHAT_POOL } from "@/lib/seed"

/**
 * A tiny "fake backend". Because this app is client-side only there is no
 * signalling server, so remote presence is driven by timers instead.
 */
export function startSimulation() {
  const timers: number[] = []

  const push = (fn: () => void, ms: number) => {
    timers.push(window.setInterval(fn, ms))
  }

  // Speaking indicators / engagement drift — fast tick.
  push(() => useMeetingStore.getState().simulateActivity(), 2600)

  // Someone says something in chat.
  push(() => {
    const s = useMeetingStore.getState()
    const others = s.participants.filter((p) => !p.isSelf)
    if (!others.length) return
    const author = others[Math.floor(Math.random() * others.length)]
    const body = CHAT_POOL[Math.floor(Math.random() * CHAT_POOL.length)]
    useMeetingStore.setState((prev) => ({
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          authorId: author.id,
          authorName: author.name,
          body,
          at: Date.now(),
        },
      ],
      unreadChat: prev.unreadChat + 1,
    }))
  }, 11_000)

  // Roster churn.
  push(() => {
    const roll = Math.random()
    if (roll > 0.55) useMeetingStore.getState().simulateJoin()
    else if (roll < 0.18) useMeetingStore.getState().simulateLeave()
  }, 17_000)

  // New audience question.
  push(() => {
    if (Math.random() > 0.5) useMeetingStore.getState().simulateQuestion()
  }, 23_000)

  // Connection quality wobble.
  push(() => {
    const roll = Math.random()
    useMeetingStore.getState().setConnection(roll > 0.85 ? "fair" : roll > 0.6 ? "good" : "excellent")
  }, 15_000)

  // Remote votes trickle into open polls.
  push(() => {
    useMeetingStore.setState((prev) => {
      if (!prev.polls.length) return prev
      return {
        polls: prev.polls.map((poll) => {
          if (!poll.open || Math.random() > 0.7) return poll
          const idx = Math.floor(Math.random() * poll.options.length)
          return {
            ...poll,
            options: poll.options.map((o, i) => (i === idx ? { ...o, votes: o.votes + 1 } : o)),
          }
        }),
      }
    })
  }, 4_500)

  // Upvotes on questions.
  push(() => {
    useMeetingStore.setState((prev) => {
      if (!prev.questions.length) return prev
      const idx = Math.floor(Math.random() * prev.questions.length)
      return {
        questions: prev.questions.map((q, i) =>
          i === idx && !q.answered ? { ...q, votes: q.votes + 1 } : q,
        ),
      }
    })
  }, 8_000)

  return () => timers.forEach((t) => window.clearInterval(t))
}
