import { Button, Empty, List, Popconfirm, Tooltip, Upload } from "antd"
import {
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import PodShell from "@/components/PodShell"
import { useMeetingStore } from "@/store/useMeetingStore"
import { clockTime, formatBytes } from "@/lib/format"

export default function FilesPod({ onClose }: { onClose?: () => void }) {
  const files = useMeetingStore((s) => s.files)
  const addFile = useMeetingStore((s) => s.addFile)
  const removeFile = useMeetingStore((s) => s.removeFile)
  const self = useMeetingStore((s) => s.participants.find((p) => p.isSelf))

  const canManage = self?.role !== "participant"

  return (
    <PodShell
      title="Files"
      icon={<FileOutlined />}
      onClose={onClose}
      flush
      extra={
        canManage ? (
          <Upload
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              addFile({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                uploadedBy: self?.name ?? "You",
                at: Date.now(),
                url: URL.createObjectURL(file),
              })
              // prevent antd from attempting a network upload
              return false
            }}
          >
            <Tooltip title="Share a file">
              <Button
                type="text"
                size="small"
                aria-label="Share a file"
                icon={<UploadOutlined style={{ fontSize: 12 }} />}
              />
            </Tooltip>
          </Upload>
        ) : null
      }
      footer={
        <span className="muted" style={{ fontSize: 11 }}>
          {files.length
            ? `${files.length} file${files.length === 1 ? "" : "s"} shared in this room`
            : "Files stay on this device only"}
        </span>
      }
    >
      {files.length === 0 ? (
        <div className="pod-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={canManage ? "Share a file with the room" : "No files shared yet"}
          />
        </div>
      ) : (
        <List
          size="small"
          dataSource={files}
          style={{ padding: "4px 6px" }}
          renderItem={(f) => (
            <List.Item
              style={{ padding: "7px 6px" }}
              actions={[
                <Tooltip title="Download" key="dl">
                  <Button
                    type="text"
                    size="small"
                    href={f.url}
                    download={f.name}
                    aria-label={`Download ${f.name}`}
                    icon={<DownloadOutlined style={{ fontSize: 12 }} />}
                  />
                </Tooltip>,
                canManage ? (
                  <Popconfirm
                    key="rm"
                    title="Remove this file?"
                    okText="Remove"
                    okButtonProps={{ danger: true, size: "small" }}
                    cancelButtonProps={{ size: "small" }}
                    onConfirm={() => removeFile(f.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      aria-label={`Remove ${f.name}`}
                      icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    />
                  </Popconfirm>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<FileOutlined style={{ fontSize: 16, opacity: 0.7 }} />}
                title={
                  <span style={{ fontSize: 12.5, wordBreak: "break-all" }}>{f.name}</span>
                }
                description={
                  <span className="muted" style={{ fontSize: 11 }}>
                    {formatBytes(f.size)} · {f.uploadedBy} · {clockTime(f.at)}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </PodShell>
  )
}
