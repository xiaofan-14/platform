import { Box } from "@mui/material";

/**
 * 登录/注册专用布局：不继承 (app) 的导航等布局，
 * 独立全屏居中，仅包裹认证相关页面。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        py: 3,
      }}
    >
      {children}
    </Box>
  );
}
