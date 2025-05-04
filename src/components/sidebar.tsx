import React, { useState } from 'react';
import {
	Box,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	IconButton,
	Tooltip,
	useMediaQuery,
	Link,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export interface SidebarProps {
	isAdmin: boolean;
}

const drawerWidth = 240;

const navItems = (isAdmin: boolean) => [
	{ label: 'Home', icon: <HomeIcon />, path: '/' },
	...(isAdmin ? [{ label: 'Admin', icon: <HomeIcon />, path: '/admin-panel' }] : [{ label: 'Questions', icon: <HomeIcon />, path: '/questionnaire-selection' }]),
];

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
	const isDesktop = useMediaQuery('(min-width: 900px)');
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const toggleDrawer = () => setOpen((prev) => !prev);

	const links = (
		<Box sx={{ width: isDesktop ? drawerWidth : 250 }} role="presentation" onClick={!isDesktop ? toggleDrawer : undefined}>
			<List>
				{navItems(isAdmin).map(({ label, icon, path }) => (
					<ListItem disablePadding key={label}>
						<Link
							component={NextLink}
							href={path}
							passHref
							style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
						>
							<ListItemButton>
								<ListItemIcon>{icon}</ListItemIcon>
								<ListItemText primary={label} />
							</ListItemButton>
						</Link>
					</ListItem>
				))}
			</List>
		</Box>
	);

	if (!isDesktop) {
		return (
			<>
				<Box component="nav" sx={{ p: 1, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
					<Tooltip title="Open menu">
						<IconButton edge="start" onClick={toggleDrawer}>
							<MenuIcon />
						</IconButton>
					</Tooltip>
				</Box>
				<Drawer anchor="top" open={open} onClose={toggleDrawer}>
					{links}
				</Drawer>
			</>
		);
	}

	return (
		<Drawer
			variant="permanent"
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				'& .MuiDrawer-paper': {
					width: drawerWidth,
					boxSizing: 'border-box',
				},
			}}
		>
			{links}
		</Drawer>
	);
};

export default Sidebar;
