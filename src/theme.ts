import { theme, type ThemeConfig } from "antd"

export const appTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#17a2a2",
    colorInfo: "#17a2a2",
    colorError: "#e5534b",
    colorWarning: "#d9a13b",
    colorSuccess: "#4f9e5e",

    colorBgBase: "#0d1117",
    colorBgContainer: "#161b22",
    colorBgElevated: "#1c232c",
    colorBorder: "#2a323d",
    colorBorderSecondary: "#222a33",

    colorText: "#e6edf3",
    colorTextSecondary: "#a9b6c3",
    colorTextTertiary: "#8b98a5",

    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    lineHeight: 1.5,
  },
  components: {
    Layout: {
      headerBg: "#161b22",
      bodyBg: "#0d1117",
      footerBg: "#161b22",
      headerHeight: 52,
      headerPadding: "0 12px",
    },
    Tabs: {
      horizontalItemPadding: "6px 10px",
      cardPadding: "4px 12px",
    },
    Button: {
      controlHeight: 32,
      fontWeight: 500,
    },
    Card: {
      bodyPadding: 16,
    },
    List: {
      itemPadding: "6px 10px",
    },
    Segmented: {
      itemSelectedBg: "#17a2a2",
      itemSelectedColor: "#03211f",
    },
    Tooltip: {
      fontSize: 12,
    },
    Modal: {
      contentBg: "#161b22",
      headerBg: "#161b22",
    },
  },
}
