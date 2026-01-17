'use client';

import { MenuList } from '@/app/lib/utils/menu';
import { List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Menu() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <List>
        {MenuList.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                href={item.path}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    borderRight: '2px solid',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}