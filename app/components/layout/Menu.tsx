'use client';

import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DevicesIcon from '@mui/icons-material/Devices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuList, type MenuItem } from '@/app/lib/utils/menu';

const RAIL_WIDTH = 64;
const DRAWER_WIDTH_EXPANDED = 240;
const SECONDARY_WIDTH = 260;
const M3_ITEM_HEIGHT = 56;
const M3_ITEM_RADIUS = 8;

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <HomeIcon />,
  Devices: <DevicesIcon />,
  Assignment: <AssignmentIcon />,
};

function NavItem({
  item,
  isActive,
  isParentActive,
  railCollapsed,
  onExpand,
  isExpanded,
  onSelect,
}: {
  item: MenuItem;
  isActive: boolean;
  isParentActive?: boolean;
  railCollapsed: boolean;
  onExpand?: () => void;
  isExpanded?: boolean;
  onSelect: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon ? ICON_MAP[item.icon] : null;

  const handleClick = () => {
    if (hasChildren) {
      onExpand?.();
    }
    onSelect();
  };

  const content = (
    <ListItemButton
      component={hasChildren ? 'div' : Link}
      href={hasChildren ? undefined : item.path}
      onClick={handleClick}
      selected={isActive}
      sx={{
        height: M3_ITEM_HEIGHT,
        minHeight: M3_ITEM_HEIGHT,
        borderRadius: M3_ITEM_RADIUS,
        mx: 1,
        mb: 0.5,
        justifyContent: railCollapsed ? 'center' : 'flex-start',
        pl: railCollapsed ? 0 : 2,
        pr: railCollapsed ? 0 : 1,
        overflow: 'hidden',
        ...((isParentActive || isExpanded) &&
          !isActive && {
            bgcolor: 'action.selected',
          }),
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' },
        },
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {Icon && (
        <Box sx={{ display: 'flex', flexShrink: 0, mr: railCollapsed ? 0 : 1.5 }}>
          {Icon}
        </Box>
      )}
      {!railCollapsed && (
        <>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: isActive || isParentActive ? 600 : 500,
              noWrap: true,
            }}
          />
          {hasChildren && (
            <Box
              sx={{
                color: isExpanded ? 'inherit' : 'text.secondary',
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </Box>
          )}
        </>
      )}
    </ListItemButton>
  );

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      {content}
    </ListItem>
  );
}

export default function Menu() {
  const pathname = usePathname();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [railExpanded, setRailExpanded] = useState(false);

  const currentParent = MenuList.find(
    (item) =>
      item.children?.some(
        (c) => pathname === c.path || pathname.startsWith(c.path + '/')
      )
  );
  const effectiveExpanded =
    expandedKey ?? (currentParent ? currentParent.path : null);
  const secondaryItems = effectiveExpanded
    ? MenuList.find((i) => i.path === effectiveExpanded)?.children ?? []
    : [];

  const handleRailSelect = () => {
    setRailExpanded(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: 'grey.100',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* 一级：窄轨 100px，悬浮展开 240px，点击选择后收起 */}
      <Box
        onMouseEnter={() => setRailExpanded(true)}
        onMouseLeave={() => setRailExpanded(false)}
        sx={{
          width: railExpanded ? DRAWER_WIDTH_EXPANDED : RAIL_WIDTH,
          flexShrink: 0,
          height: '100%',
          py: 2,
          px: 0,
          borderRadius: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <List disablePadding sx={{ px: 0 }}>
          {MenuList.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = pathname === item.path;
            const isParentActive =
              hasChildren &&
              item.children!.some(
                (c) =>
                  pathname === c.path || pathname.startsWith(c.path + '/')
              );
            const isExpanded = effectiveExpanded === item.path;

            return (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive && !hasChildren}
                isParentActive={isParentActive}
                railCollapsed={!railExpanded}
                onExpand={() =>
                  setExpandedKey(isExpanded ? null : item.path)
                }
                isExpanded={isExpanded}
                onSelect={handleRailSelect}
              />
            );
          })}
        </List>
      </Box>

      {/* 二级：侧滑展开面板（M3 从侧边滑出） */}
      <Box
        sx={{
          width: secondaryItems.length > 0 ? SECONDARY_WIDTH : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          sx={{
            width: SECONDARY_WIDTH,
            height: '100%',
            py: 2,
            px: 0,
            bgcolor: 'grey.50',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          {effectiveExpanded && (
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1,
                color: 'text.secondary',
                fontWeight: 600,
              }}
            >
              {MenuList.find((i) => i.path === effectiveExpanded)?.label}
            </Typography>
          )}
          <List disablePadding sx={{ px: 0 }}>
            {secondaryItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={isActive}
                    sx={{
                      height: M3_ITEM_HEIGHT,
                      borderRadius: M3_ITEM_RADIUS,
                      mx: 1,
                      mb: 0.5,
                      pl: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
