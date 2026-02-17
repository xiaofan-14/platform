export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  /** 二级菜单，展开时从侧边滑出 */
  children?: MenuItem[];
}

export const MenuList: MenuItem[] = [
  { label: "首页", path: "/", icon: "Home" },
  {
    label: "设备",
    path: "/device",
    icon: "Devices",
    children: [
      { label: "设备列表", path: "/device" },
      { label: "设备概览", path: "/device/overview" },
    ],
  },
  {
    label: "任务测试",
    path: "/job",
    icon: "Assignment",
    children: [
      { label: "任务列表", path: "/job" },
      { label: "新建任务", path: "/job/new" },
    ],
  },
];