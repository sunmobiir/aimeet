import type { ReactNode } from "react"
import { Button, Space, Tooltip } from "antd"
import { CloseOutlined } from "@ant-design/icons"

interface PodShellProps {
  title: string
  icon?: ReactNode
  /** rendered on the right of the header, before the close button */
  extra?: ReactNode
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  /** removes the default padding on the body */
  flush?: boolean
}

export default function PodShell({ title, icon, extra, onClose, children, footer, flush }: PodShellProps) {
  return (
    <section className="pod" aria-label={`${title} pod`}>
      <header className="pod-header">
        <span className="pod-title">
          {icon}
          {title}
        </span>
        <span style={{ flex: 1 }} />
        <Space size={2}>
          {extra}
          {onClose && (
            <Tooltip title="Close pod">
              <Button
                type="text"
                size="small"
                aria-label={`Close ${title} pod`}
                icon={<CloseOutlined style={{ fontSize: 11 }} />}
                onClick={onClose}
              />
            </Tooltip>
          )}
        </Space>
      </header>
      <div className="pod-body" style={flush ? undefined : { padding: 10 }}>
        {children}
      </div>
      {footer && <div className="pod-footer">{footer}</div>}
    </section>
  )
}
