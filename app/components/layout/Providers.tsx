'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Menu from './Menu';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const AUTH_PATHS = ['/login', '/register'];

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname != null && AUTH_PATHS.includes(pathname);

  // 登录/注册页：仅主题与基线，不包侧栏和主区域布局
  if (isAuthPage) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  // 其他页面：完整应用布局（侧栏 + 主内容区）
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Menu />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
