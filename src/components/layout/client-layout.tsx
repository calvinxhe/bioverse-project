'use client';

import { useAuth } from '@/components/context/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Box } from '@mui/material';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
	const { checkAuth } = useAuth();
	const { isAdmin } = checkAuth();

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh' }}>
			<Sidebar isAdmin={isAdmin} />
			<Box sx={{ flexGrow: 1, overflow: 'auto' }}>
				{children}
			</Box>
		</Box>
	);
} 