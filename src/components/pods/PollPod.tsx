import { useState } from "react"
import {
  App,
  Button,
  Checkbox,
  Empty,
  Flex,
  Input,
  Modal,
  Progress,
  Radio,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd"
import { DeleteOutlined, PieChartOutlined, PlusOutlined } from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import type { Poll } from "@/types"

const { Text } = Typography

function PollCard({ poll, canManage }: { poll: Poll; canManage: boolean }) {
  const votePoll = useMeetingStore((s) => s.votePoll)
  const setPollOpen = useMeetingStore((s) => s.setPollOpen)
  const removePoll = useMeetingStore((s) => s.removePoll)

  const total = poll.options.reduce((sum, o) => sum + o.votes, 0)
  const showResults = !poll.open || poll.myVotes.length > 0

  return (
    <div
      style={{
        padding: 10,
        marginBottom: 8,
        border: "1px solid var(--app-border)",
        borderRadius: 7,
        background: "var(--app-surface-2)",
      }}
    >
      <Flex align="flex-start" gap={8} style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12.5, flex: 1, lineHeight: 1.45 }}>
          {poll.question}
        </Text>
        <Tag
          color={poll.open ? "green" : "default"}
          style={{ margin: 0, fontSize: 10, lineHeight: "16px", padding: "0 5px" }}
        >
          {poll.open ? "Open" : "Closed"}
        </Tag>
      </Flex>

      {poll.open && (
        <div style={{ marginBottom: showResults ? 10 : 0 }}>
          {poll.type === "multiple-choice" ? (
            <Radio.Group
              value={poll.myVotes[0]}
              onChange={(e) => votePoll(poll.id, [e.target.value])}
              style={{ display: "flex", flexDirection: "column", gap: 5 }}
            >
              {poll.options.map((o) => (
                <Radio key={o.id} value={o.id} style={{ fontSize: 12 }}>
                  {o.label}
                </Radio>
              ))}
            </Radio.Group>
          ) : (
            <Checkbox.Group
              value={poll.myVotes}
              onChange={(vals) => votePoll(poll.id, vals as string[])}
              style={{ display: "flex", flexDirection: "column", gap: 5 }}
            >
              {poll.options.map((o) => (
                <Checkbox key={o.id} value={o.id} style={{ fontSize: 12 }}>
                  {o.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          )}
        </div>
      )}

      {showResults && (
        <div>
          {poll.options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0
            return (
              <div key={o.id} style={{ marginBottom: 5 }}>
                <Flex justify="space-between" gap={8}>
                  <Text style={{ fontSize: 11.5 }} className="truncate">
                    {o.label}
                    {poll.myVotes.includes(o.id) && (
                      <Text style={{ fontSize: 10, color: "var(--app-accent)" }}> · your vote</Text>
                    )}
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--app-text-dim)", flex: "none" }}>
                    {o.votes} · {pct}%
                  </Text>
                </Flex>
                <Progress
                  percent={pct}
                  showInfo={false}
                  size={{ height: 5 }}
                  strokeColor={poll.myVotes.includes(o.id) ? "#17a2a2" : "#4a5563"}
                  trailColor="#232b35"
                />
              </div>
            )
          })}
          <Text style={{ fontSize: 10.5, color: "var(--app-text-dim)" }}>
            {total} {total === 1 ? "response" : "responses"}
          </Text>
        </div>
      )}

      {canManage && (
        <Flex gap={6} style={{ marginTop: 8 }}>
          <Button size="small" style={{ fontSize: 11 }} onClick={() => setPollOpen(poll.id, !poll.open)}>
            {poll.open ? "Close poll" : "Reopen"}
          </Button>
          <Button
            size="small"
            danger
            type="text"
            aria-label="Delete poll"
            icon={<DeleteOutlined style={{ fontSize: 11 }} />}
            onClick={() => removePoll(poll.id)}
          />
        </Flex>
      )}
    </div>
  )
}

export default function PollPod({ onClose }: { onClose?: () => void }) {
  const { message } = App.useApp()
  const polls = useMeetingStore((s) => s.polls)
  const createPoll = useMeetingStore((s) => s.createPoll)
  const participants = useMeetingStore((s) => s.participants)

  const self = participants.find((p) => p.isSelf)
  const canManage = self?.role !== "participant"

  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [type, setType] = useState<Poll["type"]>("multiple-choice")
  const [options, setOptions] = useState(["", ""])

  function reset() {
    setQuestion("")
    setType("multiple-choice")
    setOptions(["", ""])
  }

  function submit() {
    if (!question.trim()) {
      message.warning("Give the poll a question.")
      return
    }
    if (options.filter((o) => o.trim()).length < 2) {
      message.warning("Add at least two answer options.")
      return
    }
    createPoll({ question, type, options })
    reset()
    setOpen(false)
    message.success("Poll opened to attendees.")
  }

  return (
    <PodShell
      title="Polls"
      icon={<PieChartOutlined />}
      onClose={onClose}
      extra={
        canManage ? (
          <Button
            type="text"
            size="small"
            style={{ fontSize: 11 }}
            icon={<PlusOutlined style={{ fontSize: 10 }} />}
            onClick={() => setOpen(true)}
          >
            New
          </Button>
        ) : undefined
      }
    >
      <div className="app-scroll-y" style={{ flex: 1 }}>
        {polls.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ fontSize: 11.5, color: "var(--app-text-dim)" }}>
                {canManage ? "No polls yet — create one to gauge the room." : "No polls have been opened yet."}
              </Text>
            }
          />
        ) : (
          polls.map((p) => <PollCard key={p.id} poll={p} canManage={canManage} />)
        )}
      </div>

      <Modal
        title="Create a poll"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Open poll"
        destroyOnHidden
        width={440}
      >
        <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 12 }}>
          <div>
            <Text style={{ display: "block", fontSize: 12, marginBottom: 5, color: "var(--app-text-dim)" }}>
              Question
            </Text>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which rollout date works best for your team?"
              maxLength={140}
            />
          </div>

          <div>
            <Text style={{ display: "block", fontSize: 12, marginBottom: 5, color: "var(--app-text-dim)" }}>
              Response type
            </Text>
            <Segmented
              block
              value={type}
              onChange={(v) => setType(v as Poll["type"])}
              options={[
                { label: "Single choice", value: "multiple-choice" },
                { label: "Multiple answers", value: "multiple-answers" },
              ]}
            />
          </div>

          <div>
            <Text style={{ display: "block", fontSize: 12, marginBottom: 5, color: "var(--app-text-dim)" }}>
              Options
            </Text>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              {options.map((opt, i) => (
                <Space.Compact key={i} style={{ width: "100%" }}>
                  <Input
                    value={opt}
                    onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                  />
                  {options.length > 2 && (
                    <Button
                      aria-label={`Remove option ${i + 1}`}
                      icon={<DeleteOutlined />}
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    />
                  )}
                </Space.Compact>
              ))}
              {options.length < 6 && (
                <Button
                  type="dashed"
                  block
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setOptions([...options, ""])}
                >
                  Add option
                </Button>
              )}
            </Space>
          </div>
        </Space>
      </Modal>
    </PodShell>
  )
}
