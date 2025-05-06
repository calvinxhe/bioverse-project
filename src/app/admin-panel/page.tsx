'use client';

import { AuthProvider, useAuth } from '@/components/context/auth-context';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
		<Box sx={{ p: 3 }}>
			<AdminDashboard />
		</Box>
	);
}

export default function AdminPanel() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AdminPanelContent />
			</AuthProvider>
		</QueryClientProvider>
	);
}
