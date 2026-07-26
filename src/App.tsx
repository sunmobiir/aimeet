import { ConfigProvider, App as AntApp } from "antd"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { appTheme } from "@/theme"
import LobbyPage from "@/pages/LobbyPage"
import RoomPage from "@/pages/RoomPage"

export default function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <AntApp style={{ height: "100%" }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
