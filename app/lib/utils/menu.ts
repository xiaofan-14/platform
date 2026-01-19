
export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
}

export const MenuList: MenuItem[] = [
  { label: '首页', path: '/' },
  { label: '登录', path: '/login' },
  { label: '设备', path: '/device' },
  { label: '任务测试', path: '/job' },
]
// 014030