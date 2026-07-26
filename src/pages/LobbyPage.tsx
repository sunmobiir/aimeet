import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Radio,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd"
import {
  ArrowRightOutlined,
  AudioOutlined,
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  MessageOutlined,
  PieChartOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import { useSessionStore } from "@/store/useSessionStore"
import { ROOM_TEMPLATES } from "@/lib/seed"
import type { Role } from "@/types"

const { Title, Text, Paragraph } = Typography

const FEATURES = [
  { icon: <VideoCameraOutlined />, title: "Video pods", body: "Live webcam grid with active-speaker highlighting." },
  { icon: <FormOutlined />, title: "Whiteboard", body: "Freehand annotation over a shared canvas." },
  { icon: <PieChartOutlined />, title: "Polls & Q&A", body: "Run live polls and moderate upvoted questions." },
  { icon: <MessageOutlined />, title: "Chat & notes", body: "Public or private chat plus a persistent notes pod." },
  { icon: <TeamOutlined />, title: "Roles", body: "Host, presenter and participant permission tiers." },
  { icon: <AudioOutlined />, title: "Engagement", body: "Raised hands, status signals and attention meters." },
]

export default function LobbyPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const displayName = useSessionStore((s) => s.displayName)
  const role = useSessionStore((s) => s.role)
  const rooms = useSessionStore((s) => s.rooms)
  const setDisplayName = useSessionStore((s) => s.setDisplayName)
  const setRole = useSessionStore((s) => s.setRole)
  const createRoom = useSessionStore((s) => s.createRoom)
  const removeRoom = useSessionStore((s) => s.removeRoom)
  const findRoom = useSessionStore((s) => s.findRoom)

  const [mode, setMode] = useState<"host" | "join">("host")
  const [name, setName] = useState(displayName)
  const [meetingName, setMeetingName] = useState("")
  const [template, setTemplate] = useState(ROOM_TEMPLATES[0].id)
  const [joinCode, setJoinCode] = useState("")

  function commitName(): string | null {
    const trimmed = name.trim()
    if (!trimmed) {
      message.warning("Enter a display name so others know who you are.")
      return null
    }
    setDisplayName(trimmed)
    return trimmed
  }

  function handleHost() {
    if (!commitName()) return
    setRole("host")
    const room = createRoom({ name: meetingName, template })
    navigate(`/room/${room.id}`)
  }

  function handleJoin() {
    if (!commitName()) return
    const code = joinCode.trim()
    if (!code) {
      message.warning("Enter a meeting code or link.")
      return
    }
    const existing = findRoom(code)
    if (existing) {
      navigate(`/room/${existing.id}`)
      return
    }
    // Unknown code: still let them in as a guest of an ad-hoc room.
    const room = createRoom({ name: `Meeting ${code.toUpperCase()}`, template: "collaboration" })
    message.info("Joining as a guest — this code was not found on this device.")
    navigate(`/room/${room.id}`)
  }

  function openExisting(id: string) {
    if (!commitName()) return
    navigate(`/room/${id}`)
  }

  return (
    <div className="lobby">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 24px",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <Flex align="center" gap={10}>
          <div
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--app-accent)",
              display: "grid",
              placeItems: "center",
              color: "#03211f",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            C
          </div>
          <Text strong style={{ fontSize: 17, letterSpacing: "-0.01em" }}>
            Connectly
          </Text>
        </Flex>
        <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
          Client-side demo
        </Tag>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 24px 56px" }}>
        <Row gutter={[32, 32]} align="top">
          <Col xs={24} lg={13}>
            <Title level={1} style={{ fontSize: "clamp(30px, 5vw, 46px)", marginBottom: 12, letterSpacing: "-0.02em" }}>
              <span className="text-balance">Persistent meeting rooms with pods you arrange yourself.</span>
            </Title>
            <Paragraph style={{ fontSize: 16, color: "var(--app-text-dim)", maxWidth: 560 }}>
              Connectly is a pod-based alternative to Adobe Connect. Compose layouts from video, chat, notes, polls,
              Q&amp;A and whiteboard pods, switch presets mid-session, and keep the room exactly as you left it.
            </Paragraph>

            <Row gutter={[12, 12]} style={{ marginTop: 28, maxWidth: 620 }}>
              {FEATURES.map((f) => (
                <Col xs={12} sm={8} key={f.title}>
                  <div
                    style={{
                      height: "100%",
                      padding: 12,
                      border: "1px solid var(--app-border)",
                      borderRadius: 8,
                      background: "rgb(22 27 34 / 70%)",
                    }}
                  >
                    <div style={{ color: "var(--app-accent)", fontSize: 17, marginBottom: 6 }}>{f.icon}</div>
                    <Text strong style={{ display: "block", fontSize: 13 }}>
                      {f.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: "var(--app-text-dim)", lineHeight: 1.5 }}>{f.body}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>

          <Col xs={24} lg={11}>
            <Card
              styles={{ body: { padding: 20 } }}
              style={{ background: "var(--app-surface)", borderColor: "var(--app-border)" }}
            >
              <Segmented
                block
                value={mode}
                onChange={(v) => setMode(v as "host" | "join")}
                options={[
                  { label: "Start a meeting", value: "host" },
                  { label: "Join a meeting", value: "join" },
                ]}
                style={{ marginBottom: 20 }}
              />

              <Form layout="vertical" requiredMark={false}>
                <Form.Item label="Your display name" style={{ marginBottom: 16 }}>
                  <Input
                    size="large"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Ellis"
                    maxLength={40}
                  />
                </Form.Item>

                {mode === "host" ? (
                  <>
                    <Form.Item label="Meeting name" style={{ marginBottom: 16 }}>
                      <Input
                        size="large"
                        value={meetingName}
                        onChange={(e) => setMeetingName(e.target.value)}
                        placeholder="Q3 Product Review"
                        maxLength={60}
                        onPressEnter={handleHost}
                      />
                    </Form.Item>

                    <Form.Item label="Room template" style={{ marginBottom: 20 }}>
                      <Radio.Group
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}
                      >
                        {ROOM_TEMPLATES.map((t) => (
                          <Radio
                            key={t.id}
                            value={t.id}
                            style={{
                              alignItems: "flex-start",
                              margin: 0,
                              padding: "10px 12px",
                              border: `1px solid ${template === t.id ? "var(--app-accent)" : "var(--app-border)"}`,
                              borderRadius: 8,
                              background: template === t.id ? "rgb(23 162 162 / 8%)" : "transparent",
                            }}
                          >
                            <Text strong style={{ display: "block", fontSize: 13 }}>
                              {t.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: "var(--app-text-dim)" }}>{t.description}</Text>
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>

                    <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={handleHost}>
                      Open room as host
                    </Button>
                  </>
                ) : (
                  <>
                    <Form.Item
                      label="Meeting code"
                      extra={
                        <Text style={{ fontSize: 12, color: "var(--app-text-dim)" }}>
                          Any code works in this demo — unknown codes open a guest room.
                        </Text>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      <Input
                        size="large"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="mono"
                        maxLength={12}
                        onPressEnter={handleJoin}
                      />
                    </Form.Item>

                    <Form.Item label="Join as" style={{ marginBottom: 20 }}>
                      <Radio.Group
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        optionType="button"
                        buttonStyle="solid"
                        style={{ width: "100%", display: "flex" }}
                      >
                        <Radio.Button value="host" style={{ flex: 1, textAlign: "center" }}>
                          Host
                        </Radio.Button>
                        <Radio.Button value="presenter" style={{ flex: 1, textAlign: "center" }}>
                          Presenter
                        </Radio.Button>
                        <Radio.Button value="participant" style={{ flex: 1, textAlign: "center" }}>
                          Participant
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>

                    <Button type="primary" size="large" block icon={<ArrowRightOutlined />} onClick={handleJoin}>
                      Join meeting
                    </Button>
                  </>
                )}
              </Form>
            </Card>

            <Card
              title={
                <Space size={8}>
                  <Text strong style={{ fontSize: 13 }}>
                    Your rooms
                  </Text>
                  <Badge
                    count={rooms.length}
                    showZero
                    style={{ background: "var(--app-surface-2)", color: "var(--app-text-dim)" }}
                  />
                </Space>
              }
              size="small"
              style={{ marginTop: 16, background: "var(--app-surface)", borderColor: "var(--app-border)" }}
              styles={{ body: { padding: rooms.length ? "4px 0" : 16 } }}
            >
              {rooms.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text style={{ fontSize: 12, color: "var(--app-text-dim)" }}>
                      Rooms you open stay listed here on this device.
                    </Text>
                  }
                />
              ) : (
                <List
                  size="small"
                  dataSource={rooms}
                  renderItem={(room) => (
                    <List.Item
                      style={{ padding: "8px 16px" }}
                      actions={[
                        <Button
                          key="open"
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openExisting(room.id)}
                        >
                          Enter
                        </Button>,
                        <Button
                          key="del"
                          type="text"
                          size="small"
                          danger
                          aria-label={`Delete ${room.name}`}
                          icon={<DeleteOutlined />}
                          onClick={() => removeRoom(room.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Text style={{ fontSize: 13 }} className="truncate">
                            {room.name}
                          </Text>
                        }
                        description={
                          <Space size={6}>
                            <Text className="mono" style={{ fontSize: 11, color: "var(--app-accent)" }}>
                              {room.code}
                            </Text>
                            <Text style={{ fontSize: 11, color: "var(--app-text-dim)" }}>
                              {ROOM_TEMPLATES.find((t) => t.id === room.template)?.name ?? room.template}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  )
}
