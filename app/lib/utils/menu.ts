
export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
}

export const MenuList: MenuItem[] = [
  { label: '首页', path: '/' },
  { label: '登录', path: '/login' },
]