import { useMemo, useState } from "react"
import { Button, Empty, Flex, Input, Segmented, Tag, Typography } from "antd"
import { CheckOutlined, CloseOutlined, LikeFilled, LikeOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { clockTime } from "@/lib/format"

const { Text } = Typography

export default function QaPod({ onClose }: { onClose?: () => void }) {
  const questions = useMeetingStore((s) => s.questions)
  const askQuestion = useMeetingStore((s) => s.askQuestion)
  const voteQuestion = useMeetingStore((s) => s.voteQuestion)
  const answerQuestion = useMeetingStore((s) => s.answerQuestion)
  const dismissQuestion = useMeetingStore((s) => s.dismissQuestion)
  const participants = useMeetingStore((s) => s.participants)

  const self = participants.find((p) => p.isSelf)
  const canModerate = self?.role !== "participant"

  const [draft, setDraft] = useState("")
  const [sort, setSort] = useState<"top" | "recent">("top")
  const [answering, setAnswering] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState("")

  const sorted = useMemo(() => {
    const list = [...questions]
    if (sort === "top") list.sort((a, b) => Number(a.answered) - Number(b.answered) || b.votes - a.votes)
    else list.sort((a, b) => b.at - a.at)
    return list
  }, [questions, sort])

  function submitAnswer(id: string) {
    if (!answerDraft.trim()) return
    answerQuestion(id, answerDraft.trim())
    setAnswering(null)
    setAnswerDraft("")
  }

  const openCount = questions.filter((q) => !q.answered).length

  return (
    <PodShell
      title={`Q&A ${openCount > 0 ? openCount : ""}`.trim()}
      icon={<QuestionCircleOutlined />}
      onClose={onClose}
      extra={
        <Segmented
          size="small"
          value={sort}
          onChange={(v) => setSort(v as "top" | "recent")}
          options={[
            { label: "Top", value: "top" },
            { label: "Recent", value: "recent" },
          ]}
        />
      }
      footer={
        <Flex gap={6}>
          <Input
            size="small"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              askQuestion(draft)
              setDraft("")
            }}
            placeholder="Ask a question…"
            maxLength={280}
          />
          <Button
            size="small"
            type="primary"
            disabled={!draft.trim()}
            onClick={() => {
              askQuestion(draft)
              setDraft("")
            }}
          >
            Ask
          </Button>
        </Flex>
      }
    >
      <div className="app-scroll-y" style={{ flex: 1 }}>
        {sorted.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ fontSize: 11.5, color: "var(--app-text-dim)" }}>
                No questions yet. Ask the first one below.
              </Text>
            }
          />
        ) : (
          sorted.map((q) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                gap: 8,
                padding: 9,
                marginBottom: 7,
                border: `1px solid ${q.answered ? "rgb(79 158 94 / 35%)" : "var(--app-border)"}`,
                borderRadius: 7,
                background: q.answered ? "rgb(79 158 94 / 7%)" : "var(--app-surface-2)",
              }}
            >
              <button
                type="button"
                onClick={() => voteQuestion(q.id)}
                aria-label={q.votedBySelf ? "Remove upvote" : "Upvote question"}
                aria-pressed={q.votedBySelf}
                style={{
                  flex: "none",
                  width: 34,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  padding: "3px 0",
                  border: `1px solid ${q.votedBySelf ? "var(--app-accent)" : "var(--app-border)"}`,
                  borderRadius: 5,
                  background: q.votedBySelf ? "rgb(23 162 162 / 14%)" : "transparent",
                  color: q.votedBySelf ? "var(--app-accent)" : "var(--app-text-dim)",
                  cursor: "pointer",
                }}
              >
                {q.votedBySelf ? <LikeFilled style={{ fontSize: 11 }} /> : <LikeOutlined style={{ fontSize: 11 }} />}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{q.votes}</span>
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ display: "block", fontSize: 12.5, lineHeight: 1.45 }}>{q.body}</Text>
                <Flex align="center" gap={6} wrap style={{ marginTop: 3 }}>
                  <Text style={{ fontSize: 10.5, color: "var(--app-text-dim)" }}>
                    {q.authorId === "self" ? "You" : q.authorName} · {clockTime(q.at)}
                  </Text>
                  {q.answered && (
                    <Tag color="green" style={{ margin: 0, fontSize: 9.5, lineHeight: "14px", padding: "0 4px" }}>
                      Answered
                    </Tag>
                  )}
                </Flex>

                {q.answer && (
                  <div
                    style={{
                      marginTop: 6,
                      paddingLeft: 8,
                      borderLeft: "2px solid rgb(79 158 94 / 55%)",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "var(--app-text-secondary, #a9b6c3)" }}>{q.answer}</Text>
                  </div>
                )}

                {canModerate && !q.answered && (
                  <div style={{ marginTop: 6 }}>
                    {answering === q.id ? (
                      <Flex gap={5}>
                        <Input
                          size="small"
                          autoFocus
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
                            e.preventDefault()
                            submitAnswer(q.id)
                          }}
                          placeholder="Type an answer…"
                        />
                        <Button
                          size="small"
                          type="primary"
                          aria-label="Save answer"
                          icon={<CheckOutlined style={{ fontSize: 10 }} />}
                          onClick={() => submitAnswer(q.id)}
                        />
                        <Button
                          size="small"
                          aria-label="Cancel answering"
                          icon={<CloseOutlined style={{ fontSize: 10 }} />}
                          onClick={() => {
                            setAnswering(null)
                            setAnswerDraft("")
                          }}
                        />
                      </Flex>
                    ) : (
                      <Flex gap={4}>
                        <Button
                          size="small"
                          type="text"
                          style={{ fontSize: 11, height: 22, padding: "0 6px" }}
                          onClick={() => {
                            setAnswering(q.id)
                            setAnswerDraft("")
                          }}
                        >
                          Answer
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          danger
                          style={{ fontSize: 11, height: 22, padding: "0 6px" }}
                          onClick={() => dismissQuestion(q.id)}
                        >
                          Dismiss
                        </Button>
                      </Flex>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PodShell>
  )
}
