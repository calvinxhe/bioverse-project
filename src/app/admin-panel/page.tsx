'use client';

import { AuthProvider, useAuth } from '@/components/context/auth-context';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from '@/components/sidebar';
import { AdminDashboard } from '@/components/pages/admin-dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box } from '@mui/material';

// Create a client
const queryClient = new QueryClient();

function AdminPanelContent() {
	const { checkAuth } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const { isAdmin } = checkAuth();
		if (!isAdmin) {
			router.push('/');
		}
	}, [checkAuth, router]);

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh' }}>
			<Sidebar isAdmin={true} />
			<Box sx={{ flexGrow: 1, overflow: 'auto' }}>
				<AdminDashboard />
			</Box>
		</Box>
	);
}

const AdminPanel = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AdminPanelContent />
			</AuthProvider>
		</QueryClientProvider>
	);
};

export default AdminPanel;
